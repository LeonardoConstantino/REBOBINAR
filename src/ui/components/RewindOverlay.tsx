import React from 'react';
import { useGameStore } from '../store';
import { Rewind } from 'lucide-react';

interface RewindOverlayProps {
  onSkipRewind: () => void;
}

export const RewindOverlay: React.FC<RewindOverlayProps> = ({ onSkipRewind }) => {
  const { isRewinding, rewindProgress, canSkipRewind, takesCount } = useGameStore();

  if (!isRewinding) return null;

  return (
    <div
      onClick={canSkipRewind ? onSkipRewind : undefined}
      className="absolute inset-0 z-30 pointer-events-auto flex flex-col items-center justify-between p-6 select-none bg-black/35 backdrop-blur-[1px] cursor-pointer"
    >
      {/* Top Warning Banner */}
      <div className="flex items-center gap-2 bg-[#D94B43] text-black font-display text-lg tracking-widest px-4 py-1 rounded shadow-lg animate-pulse">
        <Rewind className="w-5 h-5" />
        <span>REBOBINANDO PELÍCULA</span>
      </div>

      {/* Middle Take Stamp */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="border-4 border-[#D69A45] bg-[#17191D]/90 p-4 rounded-sm shadow-2xl">
          <div className="text-xs font-mono-film text-[#E8DFC9]/70 tracking-widest">
            CORTE DO DIRETOR
          </div>
          <div className="font-display text-5xl text-[#D69A45] tracking-wider mt-1">
            TOMADA ×{takesCount}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-black/60 rounded-full overflow-hidden border border-[#E8DFC9]/20 mt-4">
          <div
            className="h-full bg-[#D69A45] transition-all"
            style={{ width: `${Math.round(rewindProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* Bottom Skip Indicator */}
      <div className="text-center">
        {canSkipRewind ? (
          <button
            onClick={onSkipRewind}
            className="px-4 py-1.5 bg-[#E8DFC9] text-[#17191D] font-mono-film text-xs font-bold rounded-sm shadow-md hover:bg-white transition-all cursor-pointer animate-bounce"
          >
            TOQUE PARA PULAR (BARRA DE ESPAÇO)
          </button>
        ) : (
          <span className="text-[10px] font-mono-film text-[#E8DFC9]/40">
            Rebobinando negativos...
          </span>
        )}
      </div>
    </div>
  );
};
