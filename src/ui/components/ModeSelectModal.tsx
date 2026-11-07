import React from 'react';
import { useGameStore } from '../store';
import { MODES } from '../../content/modes';
import { ModeId } from '../../core/types';
import { X, Check } from 'lucide-react';

interface ModeSelectModalProps {
  onSelectMode: (mode: ModeId) => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({ onSelectMode }) => {
  const { activeModal, closeModal, mode } = useGameStore();

  if (activeModal !== 'mode_select') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto select-none">
      <div className="relative bg-[#17191D] border-2 border-[#D69A45] rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#E8DFC9]/20 flex items-center justify-between bg-[#1D2127]">
          <div>
            <h2 className="font-display text-2xl tracking-wider text-[#D69A45]">
              CORTES DO DIRETOR (MODOS)
            </h2>
            <p className="text-[11px] font-mono-film text-[#E8DFC9]/60">
              SELECIONE A VERSÃO DA MONTAGEM DO FILME
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 bg-[#2A2E35] text-[#E8DFC9] hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modes List */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {Object.values(MODES).map((m) => {
            const isSelected = m.id === mode;
            return (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMode(m.id);
                  closeModal();
                }}
                className={`p-4 rounded border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1D2127] shadow-lg'
                    : 'bg-[#17191D]/60 hover:bg-[#1D2127]/80 opacity-75 hover:opacity-100'
                }`}
                style={{
                  borderColor: isSelected ? m.paletteAccent : 'rgba(232, 223, 201, 0.15)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-mono-film font-bold rounded"
                      style={{
                        backgroundColor: `${m.paletteAccent}25`,
                        color: m.paletteAccent,
                      }}
                    >
                      {m.badge}
                    </span>
                    <h3 className="font-display text-xl tracking-wide text-[#E8DFC9]">
                      {m.name}
                    </h3>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-xs font-mono-film text-[#91B66B]">
                      <Check className="w-4 h-4" /> ATIVO
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#E8DFC9]/80 mb-2">{m.description}</p>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono-film bg-black/40 p-2 rounded">
                  <div>
                    <span className="text-[#E8DFC9]/40 block">RETOMADA</span>
                    <span className={m.hasRetake ? 'text-[#91B66B]' : 'text-[#D94B43]'}>
                      {m.hasRetake ? 'DISPONÍVEL' : 'NENHUMA'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#E8DFC9]/40 block">REBOBINAR</span>
                    <span className="text-[#E8DFC9] font-bold">
                      {m.rewindDurationMs === 0 ? 'INSTANTÂNEO' : `${m.rewindDurationMs}ms`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#E8DFC9]/40 block">DENSIDADE</span>
                    <span className="text-[#D69A45] font-bold">{m.initialDensity}x BASE</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
