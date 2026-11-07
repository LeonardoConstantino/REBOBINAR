/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { World } from './sim/world';
import { Renderer } from './render/renderer';
import { GameLoop } from './core/loop';
import { inputManager } from './platform/input/inputManager';
import { audioEngine } from './platform/audio/audioEngine';
import { dbService } from './platform/storage/db';
import { eventBus } from './core/eventbus';
import { useGameStore } from './ui/store';
import { HUD } from './ui/components/HUD';
import { VirtualPad } from './ui/components/VirtualPad';
import { RewindOverlay } from './ui/components/RewindOverlay';
import { PosterModal } from './ui/components/PosterModal';
import { CinemathequeModal } from './ui/components/CinemathequeModal';
import { SettingsModal } from './ui/components/SettingsModal';
import { ModeSelectModal } from './ui/components/ModeSelectModal';
import { OrientationLock } from './ui/components/OrientationLock';
import { TitleScreen } from './ui/components/TitleScreen';
import { ModeId } from './core/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const loopRef = useRef<GameLoop | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  const {
    mode,
    currentScreen,
    setMode,
    updateHUD,
    setSplit,
    setBestDistance,
    setRewindState,
    setLastRunStats,
    loadInitialData,
    settings,
  } = useGameStore();

  // Initialize DB and load settings
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Focus window and canvas, and unlock audio
  const focusAndUnlock = useCallback(() => {
    window.focus();
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
    if (!audioUnlocked) {
      audioEngine.init();
      audioEngine.setVolume(settings.volume);
      setAudioUnlocked(true);
    }
  }, [audioUnlocked, settings.volume]);

  // Initial focus on mount
  useEffect(() => {
    window.focus();
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  }, []);

  // Main lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Instantiate Sim, Render, and Loop
    const world = new World(mode);
    const renderer = new Renderer(canvas);

    worldRef.current = world;
    rendererRef.current = renderer;

    // Apply initial settings to renderer
    renderer.fxTier = settings.fxTier;
    renderer.marksVisibility = settings.marksVisibility;
    renderer.flickerReduced = settings.flickerReduction;
    renderer.camera.setShakeMultiplier(settings.screenShake);

    // Load stored death marks for current mode
    dbService.getAllDeathMarks(mode).then((marks) => {
      renderer.setDeathMarks(marks);
    });

    // Wire EventBus to UI / DB / Camera
    const unsubDied = eventBus.on('player:died', ({ stats }) => {
      setLastRunStats(stats);
      dbService.recordRunEnd(stats);
    });

    const unsubRewindStart = eventBus.on('rewind:started', ({ durationMs }) => {
      setRewindState(true, 0, false);
      // GDD Section 6.1: Allow skip after 150ms to avoid accidental taps
      setTimeout(() => {
        setRewindState(true, 0, true);
      }, Math.min(150, durationMs));
    });

    const unsubRewindProgress = eventBus.on('rewind:progress', ({ progress }) => {
      setRewindState(true, progress, true);
    });

    const unsubRewindFinished = eventBus.on('rewind:finished', ({ mode: finishMode }) => {
      setRewindState(false, 1, false);
      // Reload updated death marks
      dbService.getAllDeathMarks(finishMode).then((marks) => {
        if (rendererRef.current) {
          rendererRef.current.setDeathMarks(marks);
        }
      });
    });

    const unsubKeyframe = eventBus.on('keyframe:crossed', ({ split }) => {
      setSplit(split);
    });

    const unsubShake = eventBus.on('camera:shake', ({ intensity, durationSeconds }) => {
      renderer.camera.addShake(intensity, durationSeconds);
    });

    const unsubRecord = eventBus.on('record:broken', ({ distanceMeters }) => {
      setBestDistance(distanceMeters);
    });

    // Fixed timestep loop callbacks
    const onTick = () => {
      if (useGameStore.getState().currentScreen !== 'game') {
        return;
      }

      const input = inputManager.poll();
      world.tick(input);

      // Periodically sync reactive UI state (HUD)
      updateHUD({
        distanceMeters: Math.floor(world.player.x / 16),
        takesCount: world.takesCount,
        pressure: world.finalCut.currentPressure,
        retakeCharges: world.retakeCharges,
        storedPowerup: world.player.storedPowerup,
        activePowerup: world.player.activePowerup,
        activePowerupTimer: world.player.activePowerupTimer,
      });
    };

    const onRender = (alpha: number) => {
      if (useGameStore.getState().currentScreen === 'game') {
        renderer.render(world, alpha);
      }
    };

    const onDegraded = () => {
      // Auto-degrade FX tier if frame times exceed budget (GDD 15.2)
      if (renderer.fxTier === 'high') {
        renderer.fxTier = 'mid';
      } else if (renderer.fxTier === 'mid') {
        renderer.fxTier = 'low';
      }
    };

    const loop = new GameLoop(onTick, onRender, onDegraded);
    loopRef.current = loop;
    loop.start();

    return () => {
      loop.destroy();
      renderer.destroy();
      unsubDied();
      unsubRewindStart();
      unsubRewindProgress();
      unsubRewindFinished();
      unsubKeyframe();
      unsubShake();
      unsubRecord();
    };
  }, [mode]);

  // Keep renderer in sync with settings updates
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.fxTier = settings.fxTier;
      rendererRef.current.marksVisibility = settings.marksVisibility;
      rendererRef.current.flickerReduced = settings.flickerReduction;
      rendererRef.current.camera.setShakeMultiplier(settings.screenShake);
    }
  }, [settings]);

  const handleSelectMode = (newMode: ModeId) => {
    setMode(newMode);
    if (worldRef.current) {
      worldRef.current.setMode(newMode);
    }
    dbService.getCorridor(newMode).then((corridor) => {
      setBestDistance(corridor.bestDistance);
    });
    dbService.getAllDeathMarks(newMode).then((marks) => {
      if (rendererRef.current) {
        rendererRef.current.setDeathMarks(marks);
      }
    });
  };

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (loopRef.current) {
      loopRef.current.setPaused(nextPaused);
    }
  };

  const handleSkipRewind = () => {
    if (worldRef.current) {
      worldRef.current.skipRewind();
    }
  };

  return (
    <div
      tabIndex={0}
      onClick={focusAndUnlock}
      onPointerDown={focusAndUnlock}
      onTouchStart={focusAndUnlock}
      onKeyDown={focusAndUnlock}
      className="relative w-screen h-screen bg-[#17191D] overflow-hidden select-none outline-none"
    >
      {/* Logical Game Canvas */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="absolute inset-0 w-full h-full block cursor-crosshair outline-none"
      />

      {/* Title Screen "A ÚLTIMA SESSÃO" */}
      {currentScreen === 'title' && <TitleScreen />}

      {/* Active Game Screen HUD & Controls */}
      {currentScreen === 'game' && (
        <>
          <HUD onTogglePause={handleTogglePause} isPaused={isPaused} />
          <VirtualPad />
          <RewindOverlay onSkipRewind={handleSkipRewind} />
        </>
      )}

      {/* Modals */}
      <PosterModal />
      <CinemathequeModal />
      <SettingsModal />
      <ModeSelectModal onSelectMode={handleSelectMode} />

      {/* Portrait Screen Orientation Lock */}
      <OrientationLock />
    </div>
  );
}
