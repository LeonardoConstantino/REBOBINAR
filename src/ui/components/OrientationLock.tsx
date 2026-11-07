import React, { useEffect } from 'react';
import { useGameStore } from '../store';
import { RotateCcw, Maximize } from 'lucide-react';
import { toggleFullscreen, isFullscreenSupported } from '../../platform/fullscreen';

export const OrientationLock: React.FC = () => {
  const { isPortrait, setPortrait } = useGameStore();

  useEffect(() => {
    const checkOrientation = () => {
      const isPort = window.innerHeight > window.innerWidth;
      setPortrait(isPort);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [setPortrait]);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#17191D] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-full border-2 border-[#D69A45] flex items-center justify-center mb-4 text-[#D69A45] animate-spin">
        <RotateCcw className="w-8 h-8" />
      </div>

      <h1 className="font-display text-3xl tracking-wider text-[#E8DFC9] mb-2">
        GIRE O DISPOSITIVO
      </h1>

      <p className="text-xs font-mono-film text-[#E8DFC9]/70 max-w-xs leading-relaxed">
        REBOBINAR foi montado no formato cinematográfico 16:9. Por favor, gire seu celular para a posição horizontal (Landscape) para gravar a tomada.
      </p>

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="px-3 py-1 bg-[#D69A45]/20 border border-[#D69A45] rounded text-[10px] font-mono-film text-[#D69A45]">
          FORMATO 16:9 OBRIGATÓRIO
        </div>

        {isFullscreenSupported() && (
          <button
            onClick={() => toggleFullscreen()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2E35] border border-[#E8DFC9]/30 hover:border-[#D69A45] rounded text-xs font-mono-film text-[#E8DFC9] cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5 text-[#D69A45]" />
            <span>ATIVAR TELA CHEIA</span>
          </button>
        )}
      </div>
    </div>
  );
};
