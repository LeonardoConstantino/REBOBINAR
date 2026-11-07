import React from 'react';
import { useGameStore } from '../store';
import { audioEngine } from '../../platform/audio/audioEngine';
import { X, Volume2, Monitor, Eye, Sliders, ShieldCheck } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { activeModal, closeModal, settings, updateSettings } = useGameStore();

  if (activeModal !== 'settings') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto select-none">
      <div className="relative bg-[#17191D] border-2 border-[#E8DFC9]/30 rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#E8DFC9]/20 flex items-center justify-between bg-[#1D2127]">
          <div>
            <h2 className="font-display text-2xl tracking-wider text-[#D69A45]">
              AJUSTES DE PROJEÇÃO
            </h2>
            <p className="text-[11px] font-mono-film text-[#E8DFC9]/60">
              CONFIGURAÇÃO DE GRÃO, ÁUDIO E CONTROLES
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 bg-[#2A2E35] text-[#E8DFC9] hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Audio Volume */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono-film text-xs font-bold text-[#E8DFC9] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#D69A45]" />
                VOLUME GERAL
              </span>
              <span className="font-mono-film text-xs text-[#D69A45]">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                updateSettings({ volume: vol });
                audioEngine.setVolume(vol);
              }}
              className="w-full accent-[#D69A45] cursor-pointer"
            />
          </div>

          {/* FX Tier */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Monitor className="w-4 h-4 text-[#42BFC2]" />
              <span className="font-mono-film text-xs font-bold text-[#E8DFC9]">
                QUALIDADE DOS EFEITOS (FX TIER)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'mid', 'low'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => updateSettings({ fxTier: tier })}
                  className={`py-2 px-3 font-mono-film text-xs font-bold rounded-sm border transition-colors cursor-pointer ${
                    settings.fxTier === tier
                      ? 'bg-[#42BFC2]/20 border-[#42BFC2] text-[#42BFC2]'
                      : 'bg-[#1D2127] border-[#E8DFC9]/20 text-[#E8DFC9]/60 hover:text-[#E8DFC9]'
                  }`}
                >
                  {tier === 'high' ? 'ALTO (60fps)' : tier === 'mid' ? 'MÉDIO (Pad)' : 'BAIXO (Econ)'}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility: Flicker Reduction */}
          <div className="flex items-center justify-between p-3 bg-[#1D2127] border border-[#E8DFC9]/15 rounded-sm">
            <div>
              <div className="font-mono-film text-xs font-bold text-[#E8DFC9] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#91B66B]" />
                REDUÇÃO DE FLICKER (FOTOSSENSIBILIDADE)
              </div>
              <p className="text-[11px] text-[#E8DFC9]/60 mt-0.5">
                Suaviza lampejos de luz e riscos de tela intensos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.flickerReduction}
              onChange={(e) => updateSettings({ flickerReduction: e.target.checked })}
              className="w-5 h-5 accent-[#91B66B] cursor-pointer"
            />
          </div>

          {/* Screen Shake Intensity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono-film text-xs font-bold text-[#E8DFC9]">
                TREMOR DE CÂMERA (SCREEN SHAKE)
              </span>
              <span className="font-mono-film text-xs text-[#D69A45]">
                {Math.round(settings.screenShake * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={settings.screenShake}
              onChange={(e) => updateSettings({ screenShake: parseFloat(e.target.value) })}
              className="w-full accent-[#D69A45] cursor-pointer"
            />
          </div>

          {/* Death Marks Visibility */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Eye className="w-4 h-4 text-[#D94B43]" />
              <span className="font-mono-film text-xs font-bold text-[#E8DFC9]">
                MARCAS DE TOMADA (CLAQUETES)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'nearby', 'off'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSettings({ marksVisibility: opt })}
                  className={`py-2 px-3 font-mono-film text-xs font-bold rounded-sm border transition-colors cursor-pointer ${
                    settings.marksVisibility === opt
                      ? 'bg-[#D94B43]/20 border-[#D94B43] text-[#D94B43]'
                      : 'bg-[#1D2127] border-[#E8DFC9]/20 text-[#E8DFC9]/60 hover:text-[#E8DFC9]'
                  }`}
                >
                  {opt === 'all' ? 'TODAS' : opt === 'nearby' ? 'PRÓXIMAS' : 'OCULTAS'}
                </button>
              ))}
            </div>
          </div>

          {/* Pad Settings */}
          <div className="p-3 bg-[#1D2127] border border-[#E8DFC9]/15 rounded-sm space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono-film font-bold text-[#D69A45]">
              <Sliders className="w-4 h-4" />
              CONTROLES TOQUE MOBILE
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#E8DFC9]">Exibir Gamepad Virtual</span>
                <span className="text-xs font-mono-film text-[#D69A45] uppercase">
                  {settings.touchControls === 'auto' ? 'Automático' : settings.touchControls === 'always' ? 'Sempre' : 'Nunca'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {(['auto', 'always', 'never'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ touchControls: mode })}
                    className={`py-1.5 px-2 font-mono-film text-[10px] font-bold rounded-sm border transition-colors cursor-pointer ${
                      settings.touchControls === mode
                        ? 'bg-[#D69A45]/20 border-[#D69A45] text-[#D69A45]'
                        : 'bg-black/30 border-[#E8DFC9]/20 text-[#E8DFC9]/60 hover:text-[#E8DFC9]'
                    }`}
                  >
                    {mode === 'auto' ? 'AUTOMÁTICO' : mode === 'always' ? 'SEMPRE' : 'NUNCA'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#E8DFC9]">Modo Canhoto (Inverter Lados)</span>
              <input
                type="checkbox"
                checked={settings.leftHandedPad}
                onChange={(e) => updateSettings({ leftHandedPad: e.target.checked })}
                className="w-5 h-5 accent-[#D69A45] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#E8DFC9]">Escala dos Botões Virtuais</span>
                <span className="text-xs font-mono-film text-[#D69A45]">{settings.padScale}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={settings.padScale}
                onChange={(e) => updateSettings({ padScale: parseFloat(e.target.value) })}
                className="w-full accent-[#D69A45] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
