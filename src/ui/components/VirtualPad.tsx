import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { touchPadSource } from '../../platform/input/touchPadSource';
import { Btn } from '../../core/types';
import { MODES } from '../../content/modes';

export const VirtualPad: React.FC = () => {
  const { mode, settings, retakeCharges, storedPowerup } = useGameStore();
  const modeConfig = MODES[mode];
  const { leftHandedPad, padScale, touchControls } = settings;

  const [slideVisualOffset, setSlideVisualOffset] = useState<number>(0);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  const slideAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect touch-capable environment
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouchDevice(isTouch);
  }, []);

  const shouldShowPad =
    touchControls === 'always' || (touchControls === 'auto' && isTouchDevice);

  // Left Slide Zone Handlers
  const handleSlidePointerDown = (e: React.PointerEvent) => {
    // Only capture touch or pen, avoid stealing mouse clicks unless forced
    if (e.pointerType === 'mouse' && touchControls !== 'always') return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
    touchPadSource.onSlideStart(e.pointerId, e.clientX);
    setIsSliding(true);
    setSlideVisualOffset(0);
  };

  const handleSlidePointerMove = (e: React.PointerEvent) => {
    touchPadSource.onSlideMove(e.pointerId, e.clientX);
    const state = touchPadSource.slideState;
    if (state.active) {
      setSlideVisualOffset(Math.max(-36, Math.min(36, state.deltaX)));
    }
  };

  const handleSlidePointerUp = (e: React.PointerEvent) => {
    touchPadSource.onSlideEnd(e.pointerId);
    setIsSliding(false);
    setSlideVisualOffset(0);
  };

  // Button Handlers
  const handleButtonDown = (e: React.PointerEvent, btn: Btn, name: string) => {
    if (e.pointerType === 'mouse' && touchControls !== 'always') return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    touchPadSource.onButtonDown(e.pointerId, btn);
    setActiveButtons((prev) => ({ ...prev, [name]: true }));
  };

  const handleButtonUp = (e: React.PointerEvent, name: string) => {
    touchPadSource.onButtonUp(e.pointerId);
    setActiveButtons((prev) => ({ ...prev, [name]: false }));
  };

  // If not showing touch pad (desktop mode), render desktop keyboard hints
  if (!shouldShowPad) {
    return (
      <div className="absolute bottom-2 left-0 right-0 pointer-events-none flex justify-center items-center z-10 px-4">
        <div className="bg-[#17191D]/80 border border-[#E8DFC9]/15 px-3 py-1 rounded-sm backdrop-blur-xs flex items-center gap-3 text-[11px] font-mono-film text-[#E8DFC9]/75 shadow-lg">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#D69A45] rounded font-bold text-[10px]">A</kbd>
            <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#D69A45] rounded font-bold text-[10px]">D</kbd> ou <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#D69A45] rounded font-bold text-[10px]">←</kbd><kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#D69A45] rounded font-bold text-[10px]">→</kbd> Mover
          </span>
          <span className="text-[#E8DFC9]/20">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#2A2E35] text-[#E8DFC9] rounded font-bold text-[10px]">ESPAÇO</kbd> / <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#E8DFC9] rounded font-bold text-[10px]">W</kbd> Pular
          </span>
          <span className="text-[#E8DFC9]/20">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#D94B43] rounded font-bold text-[10px]">SHIFT</kbd> / <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#D94B43] rounded font-bold text-[10px]">K</kbd> Dash
          </span>
          <span className="text-[#E8DFC9]/20">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#42BFC2] rounded font-bold text-[10px]">J</kbd> / <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#42BFC2] rounded font-bold text-[10px]">E</kbd> Item
          </span>
          {modeConfig.hasRetake && (
            <>
              <span className="text-[#E8DFC9]/20">•</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#2A2E35] text-[#D69A45] rounded font-bold text-[10px]">R</kbd> Retomada
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  const isLeft = !leftHandedPad;

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-4 pb-6 select-none z-10">
      {/* 1. Dynamic Slide Zone (Left by default, Right if left-handed) */}
      <div
        className={`pointer-events-auto flex flex-col items-center justify-end ${
          isLeft ? 'order-1' : 'order-3'
        }`}
        style={{ transform: `scale(${padScale})`, transformOrigin: isLeft ? 'bottom left' : 'bottom right' }}
      >
        <div
          ref={slideAreaRef}
          onPointerDown={handleSlidePointerDown}
          onPointerMove={handleSlidePointerMove}
          onPointerUp={handleSlidePointerUp}
          onPointerCancel={handleSlidePointerUp}
          className={`w-36 h-28 rounded-2xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
            isSliding
              ? 'bg-[#17191D]/70 border-[#D69A45]/80 shadow-lg'
              : 'bg-[#17191D]/25 border-[#E8DFC9]/20 opacity-35 hover:opacity-60'
          }`}
        >
          {/* Visual Thumb Follower */}
          <div
            className={`w-14 h-14 rounded-full border border-[#E8DFC9]/60 flex items-center justify-center transition-transform duration-75 ${
              isSliding ? 'bg-[#D69A45]/40 text-[#E8DFC9]' : 'bg-[#17191D]/40 text-[#E8DFC9]/50'
            }`}
            style={{ transform: `translateX(${slideVisualOffset}px)` }}
          >
            <span className="font-mono-film text-[11px] font-bold">◄ ►</span>
          </div>
          <span className="text-[9px] font-mono-film tracking-wider mt-1.5 text-[#E8DFC9]/60 uppercase">
            Deslize
          </span>
        </div>
      </div>

      {/* 2. Middle 60% Clear Area: Guaranteed unobstructed gameplay viewing */}
      <div className="order-2 flex-1 pointer-events-none" />

      {/* 3. Action Buttons Ergonomic Arc */}
      <div
        className={`pointer-events-auto relative w-48 h-36 flex items-end justify-end ${
          isLeft ? 'order-3' : 'order-1'
        }`}
        style={{
          transform: `scale(${padScale})`,
          transformOrigin: isLeft ? 'bottom right' : 'bottom left',
        }}
      >
        {/* Retake Button (Outer arc, deliberate reach) */}
        {modeConfig.hasRetake && (
          <button
            onPointerDown={(e) => handleButtonDown(e, Btn.Retake, 'retake')}
            onPointerUp={(e) => handleButtonUp(e, 'retake')}
            onPointerCancel={(e) => handleButtonUp(e, 'retake')}
            disabled={retakeCharges <= 0}
            className={`absolute top-0 left-2 w-11 h-11 rounded-full border flex flex-col items-center justify-center transition-all ${
              activeButtons['retake']
                ? 'bg-[#D69A45] border-white scale-95 shadow-md'
                : retakeCharges > 0
                ? 'bg-[#17191D]/40 border-[#D69A45]/60 text-[#D69A45] opacity-50'
                : 'bg-black/20 border-white/10 text-white/20 opacity-20'
            }`}
          >
            <span className="font-mono-film text-[9px] font-bold">« RET</span>
          </button>
        )}

        {/* Item Button (Stored powerup) */}
        <button
          onPointerDown={(e) => handleButtonDown(e, Btn.Item, 'item')}
          onPointerUp={(e) => handleButtonUp(e, 'item')}
          onPointerCancel={(e) => handleButtonUp(e, 'item')}
          className={`absolute top-4 right-16 w-12 h-12 rounded-full border flex flex-col items-center justify-center transition-all ${
            activeButtons['item']
              ? 'bg-[#42BFC2] border-white scale-95 shadow-md'
              : storedPowerup
              ? 'bg-[#17191D]/60 border-[#42BFC2]/80 text-[#42BFC2] opacity-75'
              : 'bg-[#17191D]/30 border-[#E8DFC9]/20 text-[#E8DFC9]/40 opacity-30'
          }`}
        >
          <span className="font-mono-film text-[10px] font-bold">ITEM</span>
        </button>

        {/* Dash Button */}
        <button
          onPointerDown={(e) => handleButtonDown(e, Btn.Dash, 'dash')}
          onPointerUp={(e) => handleButtonUp(e, 'dash')}
          onPointerCancel={(e) => handleButtonUp(e, 'dash')}
          className={`absolute bottom-14 right-2 w-13 h-13 rounded-full border flex flex-col items-center justify-center transition-all ${
            activeButtons['dash']
              ? 'bg-[#D94B43] border-white scale-95 shadow-md'
              : 'bg-[#17191D]/35 border-[#E8DFC9]/30 text-[#E8DFC9] opacity-40 hover:opacity-75'
          }`}
        >
          <span className="font-mono-film text-[10px] font-bold">DASH</span>
        </button>

        {/* Jump Button (Largest target at primary thumb rest) */}
        <button
          onPointerDown={(e) => handleButtonDown(e, Btn.Jump, 'jump')}
          onPointerUp={(e) => handleButtonUp(e, 'jump')}
          onPointerCancel={(e) => handleButtonUp(e, 'jump')}
          className={`w-18 h-18 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
            activeButtons['jump']
              ? 'bg-[#E8DFC9] text-[#17191D] border-white scale-95 shadow-xl'
              : 'bg-[#17191D]/45 border-[#E8DFC9]/50 text-[#E8DFC9] opacity-60 hover:opacity-90'
          }`}
        >
          <span className="font-display text-xl tracking-wider font-bold">PULO</span>
          <span className="text-[8px] font-mono-film opacity-75">ESPAÇO</span>
        </button>
      </div>
    </div>
  );
};
