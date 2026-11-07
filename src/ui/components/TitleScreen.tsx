import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store';
import { audioEngine } from '../../platform/audio/audioEngine';
import { MODES } from '../../content/modes';
import { Play, Film, Settings, SlidersHorizontal } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export const TitleScreen: React.FC = () => {
  const { mode, startGame, openModal, settings } = useGameStore();
  const modeConfig = MODES[mode];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation timeline state:
  // 0: Dark / room silence
  // 1: Projector clicks on & lateral light cone appears (0.2s)
  // 2: Title frame drops into place (0.75s)
  // 3: Edit glitch / jump cut error (1.25s)
  // 4: Stabilized + INICIAR button active (1.65s)
  const [animStage, setAnimStage] = useState<number>(0);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [isTransitioningOut, setIsTransitioningOut] = useState<boolean>(false);
  const [buttonPressed, setButtonPressed] = useState<boolean>(false);

  // Skip / fast-forward animation sequence
  const fastForwardToReady = useCallback(() => {
    if (animStage < 4) {
      setAnimStage(4);
      setIsGlitching(false);
      audioEngine.playTitleReadyChime();
    }
  }, [animStage]);

  // Handle Start Game
  const handleStartGame = useCallback(() => {
    if (isTransitioningOut) return;
    setIsTransitioningOut(true);
    setButtonPressed(true);
    audioEngine.playStartButtonPress();

    // 350ms transition cut before gameplay starts
    setTimeout(() => {
      startGame();
    }, 350);
  }, [isTransitioningOut, startGame]);

  // Snappy introduction animation sequence (refined to 1.65s total)
  useEffect(() => {
    // Stage 1: Projector clicks on & lamp strikes
    const t1 = setTimeout(() => {
      setAnimStage(1);
      audioEngine.playSwitchClick();
    }, 200);

    // Stage 2: Title frame snaps in
    const t2 = setTimeout(() => {
      setAnimStage(2);
      audioEngine.playFilmGateSnap();
    }, 750);

    // Stage 3: Film glitch / jump cut
    const t3 = setTimeout(() => {
      setAnimStage(3);
      if (!settings.flickerReduction) {
        setIsGlitching(true);
      }
      audioEngine.playFilmGlitchCut();
    }, 1250);

    // Stage 4: Recover & stabilize
    const t4 = setTimeout(() => {
      setIsGlitching(false);
    }, 1380);

    // Stage 5: Ready with INICIAR button
    const t5 = setTimeout(() => {
      setAnimStage(4);
      audioEngine.playTitleReadyChime();
    }, 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [settings.flickerReduction]);

  // Keyboard support: Space / Enter to start (or skip intro)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (animStage < 4) {
          fastForwardToReady();
        } else {
          handleStartGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animStage, fastForwardToReady, handleStartGame]);

  // Canvas background simulation: Lateral projector light beam, floating dust particles, and rolling 35mm film strip
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let rafId = 0;
    let width = 640;
    let height = 360;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement?.clientWidth || 640;
      height = canvas.parentElement?.clientHeight || 360;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate dust particles in light cone
    const particles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: -0.3 - Math.random() * 0.4, // Drifting diagonally along the lateral projector ray
        vy: (Math.random() - 0.5) * 0.3,
        size: 1 + Math.random() * 2,
        alpha: 0.15 + Math.random() * 0.45,
      });
    }

    let filmOffset = 0;
    let lightFlickerTimer = 0;

    const render = () => {
      ctx.fillStyle = '#17191D';
      ctx.fillRect(0, 0, width, height);

      const isLightOn = animStage >= 1;

      if (isLightOn) {
        lightFlickerTimer += 0.05;
        // Subtle breathing projector light oscillation
        const lightOsc = Math.sin(lightFlickerTimer) * 0.035 + Math.cos(lightFlickerTimer * 2.3) * 0.02;
        const beamIntensity = Math.min(0.24, 0.18 + lightOsc);

        // Lateral Volumetric Projector Light Source (coming from upper-right projection booth)
        const sourceX = width * 0.85;
        const sourceY = -15;
        const targetCenterX = width * 0.45;
        const targetCenterY = height * 0.48;

        ctx.save();
        // Diagonal radial gradient representing the lantern lens
        const beamGrad = ctx.createRadialGradient(
          sourceX,
          sourceY,
          25,
          targetCenterX,
          targetCenterY,
          width * 0.85
        );
        beamGrad.addColorStop(0, `rgba(232, 223, 201, ${beamIntensity * 1.6})`);
        beamGrad.addColorStop(0.35, `rgba(214, 154, 69, ${beamIntensity * 0.8})`);
        beamGrad.addColorStop(0.85, `rgba(23, 25, 29, 0.05)`);
        beamGrad.addColorStop(1, 'rgba(23, 25, 29, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        // Angled trapezoid beam from booth aperture
        ctx.moveTo(sourceX - 30, sourceY);
        ctx.lineTo(sourceX + 30, sourceY);
        ctx.lineTo(width * 0.95, height);
        ctx.lineTo(width * 0.05, height * 0.85);
        ctx.closePath();
        ctx.fill();

        // Projector Lens Aperture Flare at the source window
        ctx.fillStyle = `rgba(214, 154, 69, ${beamIntensity * 2.0})`;
        ctx.beginPath();
        ctx.arc(sourceX, 10, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Floating illuminated dust particles caught in the beam
        ctx.save();
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) {
            p.x = width;
            p.y = Math.random() * height;
          }
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Diagonal distance to the projection beam path
          const t = Math.max(0, Math.min(1, p.x / width));
          const beamCenterY = sourceY + (targetCenterY - sourceY) * (1 - t) + height * 0.2 * t;
          const distY = Math.abs(p.y - beamCenterY);
          const inBeam = distY < height * 0.45;
          const pAlpha = inBeam ? p.alpha : p.alpha * 0.15;

          ctx.fillStyle = `rgba(232, 223, 201, ${pAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 35mm Film Strip running along the left edge
      ctx.save();
      filmOffset = (filmOffset + 0.9) % 36;
      const filmX = 24;
      const filmWidth = 32;

      ctx.fillStyle = '#1D2127';
      ctx.fillRect(filmX, 0, filmWidth, height);
      ctx.strokeStyle = '#2A2E35';
      ctx.lineWidth = 1;
      ctx.strokeRect(filmX, 0, filmWidth, height);

      // Sprocket holes along the film strip
      ctx.fillStyle = '#17191D';
      for (let y = -36 + filmOffset; y < height + 36; y += 18) {
        ctx.fillRect(filmX + 3, y, 6, 9);
        ctx.fillRect(filmX + filmWidth - 9, y, 6, 9);
      }
      ctx.restore();

      // Atmospheric vignette border
      ctx.save();
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.25,
        width / 2,
        height / 2,
        width * 0.65
      );
      vignette.addColorStop(0, 'rgba(23, 25, 29, 0)');
      vignette.addColorStop(1, 'rgba(23, 25, 29, 0.75)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      rafId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [animStage]);

  return (
    <div
      ref={containerRef}
      onClick={animStage < 4 ? fastForwardToReady : undefined}
      className="absolute inset-0 z-40 bg-[#17191D] flex flex-col justify-between overflow-hidden select-none cursor-default font-sans"
    >
      {/* Background Animated Canvas (Lateral Projector Light & Film Strip) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Outgoing transition cut overlay */}
      {isTransitioningOut && (
        <div className="absolute inset-0 z-50 bg-[#17191D] animate-fade-in pointer-events-none" />
      )}

      {/* --- TOP REGION: Editorial Header & Mode Pill --- */}
      <div className="relative z-10 flex items-center justify-between p-4 px-6 pointer-events-auto">
        {/* Left: REC Indicator & Projection Room Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#17191D]/85 border border-[#E8DFC9]/20 px-2.5 py-1 rounded-sm shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D94B43] inline-block animate-pulse" />
            <span className="font-mono-film text-xs font-bold tracking-wider text-[#E8DFC9]">
              REC
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono-film text-[#E8DFC9]/70">
            <span>SALA DE PROJEÇÃO 01</span>
            <span>•</span>
            <span>ROLO 35MM</span>
            <span>•</span>
            <span className="text-[#D69A45] font-bold">FRAME 001</span>
          </div>
        </div>

        {/* Right: Quick Access to Modals & Mode Selector */}
        <div className="flex items-center gap-2">
          {/* Mode Badge Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('mode_select');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono-film font-bold border transition-colors cursor-pointer shadow-sm hover:scale-102"
            style={{
              backgroundColor: `${modeConfig.paletteAccent}20`,
              color: modeConfig.paletteAccent,
              borderColor: `${modeConfig.paletteAccent}60`,
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{modeConfig.badge}</span>
          </button>

          {/* Cinemateca Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('cinematheque');
            }}
            title="Cinemateca (Acervo & Filmografia)"
            className="p-2 bg-[#17191D]/85 border border-[#E8DFC9]/25 hover:border-[#D69A45] text-[#E8DFC9] rounded-sm transition-colors cursor-pointer shadow-sm"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('settings');
            }}
            title="Ajustes de Projeção"
            className="p-2 bg-[#17191D]/85 border border-[#E8DFC9]/25 hover:border-[#D69A45] text-[#E8DFC9] rounded-sm transition-colors cursor-pointer shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- CENTER REGION: The REBOBINAR Title with Film Framing Reticles & Edit Glitch --- */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4">
        {animStage >= 2 && (
          <div
            className={`flex flex-col items-center transition-all duration-300 ${
              isGlitching
                ? 'translate-x-2 -translate-y-1.5 skew-x-3 filter contrast-150'
                : 'translate-x-0 translate-y-0'
            }`}
          >
            {/* Film frame top ruler cue */}
            <div className="flex items-center gap-3 text-[10px] sm:text-xs font-mono-film tracking-widest text-[#D69A45] font-semibold mb-2.5">
              <span>◄ 35MM KODAK 5219 ►</span>
              <span>•</span>
              <span>PRODUÇÃO ARCADE</span>
              <span>•</span>
              <span className="text-[#E8DFC9]">TOMADA 01</span>
            </div>

            {/* Main Logotype Box */}
            <div className="relative group">
              {/* Acetate frame border with authentic Camera Viewfinder Framing Guides */}
              <div
                className={`relative px-8 sm:px-12 py-3.5 sm:py-5 border-2 rounded-sm backdrop-blur-xs transition-colors ${
                  isGlitching
                    ? 'border-[#8068B8] bg-[#8068B8]/25'
                    : 'border-[#E8DFC9]/35 bg-[#17191D]/80 shadow-[0_8px_32px_rgba(0,0,0,0.85)]'
                }`}
              >
                {/* Refinement 1: Cinematic Viewfinder / Film Registration Framing Marks */}
                {/* Top-Left Reticle ┌ */}
                <span className="absolute -top-3 -left-3 w-5 h-5 border-t-2 border-l-2 border-[#D69A45] pointer-events-none" />
                {/* Top-Right Reticle ┐ */}
                <span className="absolute -top-3 -right-3 w-5 h-5 border-t-2 border-r-2 border-[#D69A45] pointer-events-none" />
                {/* Bottom-Left Reticle └ */}
                <span className="absolute -bottom-3 -left-3 w-5 h-5 border-b-2 border-l-2 border-[#D69A45] pointer-events-none" />
                {/* Bottom-Right Reticle ┘ */}
                <span className="absolute -bottom-3 -right-3 w-5 h-5 border-b-2 border-r-2 border-[#D69A45] pointer-events-none" />

                {/* Optical Center Crosshair Guides */}
                <span className="absolute top-1/2 -left-3 w-3 h-[1.5px] bg-[#D69A45]/70 pointer-events-none" />
                <span className="absolute top-1/2 -right-3 w-3 h-[1.5px] bg-[#D69A45]/70 pointer-events-none" />
                <span className="absolute -top-3 left-1/2 w-[1.5px] h-3 bg-[#D69A45]/70 pointer-events-none" />
                <span className="absolute -bottom-3 left-1/2 w-[1.5px] h-3 bg-[#D69A45]/70 pointer-events-none" />

                {/* Glitch chromatic split offset */}
                {isGlitching && (
                  <h1 className="absolute inset-0 flex items-center justify-center font-display text-7xl sm:text-8xl md:text-9xl tracking-wider text-[#42BFC2]/80 -translate-x-2 pointer-events-none select-none">
                    REBOBINAR
                  </h1>
                )}

                {/* Main Logo Text */}
                <h1 className="font-display text-7xl sm:text-8xl md:text-9xl tracking-wider text-[#E8DFC9] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                  REBOBINAR
                </h1>
              </div>
            </div>

            {/* Refinement 4: Fatalist-comic tagline with enhanced mobile legibility */}
            <div className="mt-4 text-center px-4">
              <p className="font-mono-film text-sm sm:text-base font-bold tracking-widest text-[#D69A45] uppercase">
                UMA NOVA TOMADA ESTÁ PRONTA.
              </p>
              <p className="text-xs sm:text-sm font-mono-film text-[#E8DFC9]/80 mt-1 max-w-md leading-relaxed">
                Onde cada morte rebobina o negativo e devolve você mais sábio.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM REGION: INICIAR Button (with Projector Pulse) & High-Legibility Status Footer --- */}
      <div className="relative z-10 flex flex-col items-center justify-end pb-6 sm:pb-8 px-4 pointer-events-auto">
        {animStage >= 4 ? (
          <div className="flex flex-col items-center gap-3.5">
            {/* Refinement 3: Primary Action Button with Projector Light Glow Breathing */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartGame();
              }}
              className={`group relative flex items-center justify-center gap-3.5 px-10 py-4 bg-[#D69A45] hover:bg-[#e6aa54] text-[#17191D] rounded-sm font-display text-2xl sm:text-3xl tracking-widest transition-all cursor-pointer ${
                buttonPressed ? 'scale-95 bg-[#e6aa54]' : 'scale-100 hover:scale-103'
              }`}
              style={{
                minHeight: '56px',
                minWidth: '240px',
                boxShadow: '0 0 28px rgba(214, 154, 69, 0.45), 0 0 60px rgba(214, 154, 69, 0.2)',
                animation: 'pulse 2.4s ease-in-out infinite',
              }}
            >
              <Play className="w-6 h-6 fill-current transition-transform group-hover:scale-115" />
              <span>INICIAR</span>

              {/* Tape notch stamp effect */}
              <span className="absolute -top-1.5 right-3 px-1.5 py-0.5 bg-[#17191D] text-[#D69A45] font-mono-film text-[9px] font-bold border border-[#D69A45]/40 rounded shadow-xs">
                REC ON
              </span>
            </button>

            {/* Desktop Keyboard Cue */}
            <div className="flex items-center gap-2 text-xs font-mono-film text-[#E8DFC9]/75">
              <span>Pressione</span>
              <kbd className="px-2 py-0.5 bg-[#2A2E35] text-[#E8DFC9] rounded border border-[#E8DFC9]/25 font-bold shadow-xs">
                ESPAÇO
              </kbd>
              <span>ou</span>
              <kbd className="px-2 py-0.5 bg-[#2A2E35] text-[#E8DFC9] rounded border border-[#E8DFC9]/25 font-bold shadow-xs">
                ENTER
              </kbd>
              <span>para rodar</span>
            </div>
          </div>
        ) : (
          /* Skip notice while intro plays */
          <div className="text-xs font-mono-film text-[#E8DFC9]/60 tracking-wider animate-pulse cursor-pointer py-2">
            TOQUE NA TELA OU ESPAÇO PARA PULAR APRESENTAÇÃO
          </div>
        )}

        {/* Refinement 4: Footer Technical Line with high-contrast legibility for small screens */}
        <div className="w-full flex justify-between items-center text-[11px] sm:text-xs font-mono-film text-[#E8DFC9]/70 mt-5 pt-2.5 border-t border-[#E8DFC9]/15 max-w-4xl px-2">
          <span>PROJEÇÃO ARCADE • 60 FPS</span>
          <span className="flex items-center gap-1.5 text-[#91B66B] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#91B66B] inline-block" />
            FILME CARREGADO
          </span>
          <span className="text-[#D69A45] font-bold">REBOBINAR V1.0</span>
        </div>
      </div>
    </div>
  );
};
