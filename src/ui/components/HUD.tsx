import React from 'react';
import { useGameStore } from '../store';
import { MODES } from '../../content/modes';
import { Film, Image as ImageIcon, Settings, Pause, Rewind, Zap, Play } from 'lucide-react';

interface HUDProps {
  onTogglePause: () => void;
  isPaused: boolean;
}

export const HUD: React.FC<HUDProps> = ({ onTogglePause, isPaused }) => {
  const {
    mode,
    distanceMeters,
    bestDistanceMeters,
    takesCount,
    pressure,
    retakeCharges,
    storedPowerup,
    activePowerup,
    activePowerupTimer,
    latestSplit,
    openModal,
  } = useGameStore();

  const modeConfig = MODES[mode];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Slate & Takes Info */}
        <div className="flex items-center gap-2 bg-[#17191D]/85 border border-[#E8DFC9]/20 px-3 py-1.5 rounded-sm backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
              style={{ backgroundColor: pressure > 0.6 ? '#D94B43' : '#91B66B' }}
            />
            <span className="font-mono-film text-xs font-bold tracking-wider text-[#E8DFC9]">
              REC
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#E8DFC9]/20 mx-1" />

          {/* Mode Pill */}
          <button
            onClick={() => openModal('mode_select')}
            className="text-[10px] font-mono-film font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            style={{
              backgroundColor: `${modeConfig.paletteAccent}25`,
              color: modeConfig.paletteAccent,
              border: `1px solid ${modeConfig.paletteAccent}60`,
            }}
          >
            {modeConfig.badge}
          </button>

          {/* Tomada counter */}
          <div className="text-xs font-mono-film font-semibold text-[#E8DFC9]">
            TOMADA <span className="text-[#D69A45]">×{takesCount}</span>
          </div>
        </div>

        {/* Center: Distance and Splits */}
        <div className="flex flex-col items-center">
          <div className="bg-[#17191D]/90 border border-[#D69A45]/40 px-4 py-1 rounded-sm shadow-md flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-wider text-[#E8DFC9]">
              {Math.floor(distanceMeters)}
            </span>
            <span className="font-mono-film text-xs text-[#D69A45]">METROS</span>
            {bestDistanceMeters > 0 && (
              <span className="text-[10px] font-mono-film text-[#E8DFC9]/50 ml-1">
                (REC: {Math.floor(bestDistanceMeters)}m)
              </span>
            )}
          </div>

          {/* Split indicator popup */}
          {latestSplit && (
            <div className="mt-1 px-2.5 py-0.5 bg-[#17191D]/95 border border-[#42BFC2]/40 rounded-sm text-[11px] font-mono-film text-[#42BFC2] animate-bounce">
              CENA {Math.floor(latestSplit.distanceMeters / 100)} — {latestSplit.timeSeconds.toFixed(1)}s
            </div>
          )}
        </div>

        {/* Right: Actions and Modals */}
        <div className="flex items-center gap-1.5">
          {/* Retake Reels (Charges) */}
          {modeConfig.hasRetake && (
            <div className="bg-[#17191D]/85 border border-[#D69A45]/30 px-2.5 py-1 rounded-sm flex items-center gap-1">
              <Rewind className="w-3.5 h-3.5 text-[#D69A45]" />
              <span className="font-mono-film text-xs font-bold text-[#E8DFC9]">
                {retakeCharges}
              </span>
              <span className="text-[9px] font-mono-film text-[#E8DFC9]/50">RETOMADA</span>
            </div>
          )}

          {/* Active Powerup Pill */}
          {activePowerup && (
            <div className="bg-[#17191D]/85 border border-[#42BFC2]/50 px-2.5 py-1 rounded-sm flex items-center gap-1.5 text-xs font-mono-film text-[#42BFC2]">
              <Zap className="w-3.5 h-3.5 animate-spin" />
              <span>{activePowerupTimer.toFixed(1)}s</span>
            </div>
          )}

          {/* Stored Powerup Pill */}
          {storedPowerup && !activePowerup && (
            <div className="bg-[#D69A45]/20 border border-[#D69A45] px-2 py-1 rounded-sm text-xs font-mono-film text-[#D69A45] flex items-center gap-1">
              <span>ITEM: {storedPowerup === 'golden_tape' ? 'FITA' : storedPowerup === 'slow_cam' ? 'LENTA' : 'PAUSA'}</span>
              <span className="text-[9px] opacity-75">(J)</span>
            </div>
          )}

          {/* Top buttons */}
          <button
            onClick={() => openModal('cinematheque')}
            title="Cinemateca"
            className="p-1.5 bg-[#17191D]/85 border border-[#E8DFC9]/20 hover:border-[#D69A45] text-[#E8DFC9] rounded-sm transition-colors cursor-pointer"
          >
            <Film className="w-4 h-4" />
          </button>

          <button
            onClick={() => openModal('poster')}
            title="Cartaz do Filme"
            className="p-1.5 bg-[#17191D]/85 border border-[#E8DFC9]/20 hover:border-[#D69A45] text-[#E8DFC9] rounded-sm transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => openModal('settings')}
            title="Ajustes"
            className="p-1.5 bg-[#17191D]/85 border border-[#E8DFC9]/20 hover:border-[#D69A45] text-[#E8DFC9] rounded-sm transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePause}
            title={isPaused ? 'Continuar' : 'Pausar'}
            className="p-1.5 bg-[#17191D]/85 border border-[#E8DFC9]/20 hover:border-[#D94B43] text-[#E8DFC9] rounded-sm transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4 text-[#91B66B]" /> : <Pause className="w-4 h-4 text-[#D94B43]" />}
          </button>
        </div>
      </div>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-auto z-40 select-none">
          <div className="bg-[#17191D] border-2 border-[#D69A45] rounded-lg p-6 max-w-sm w-full flex flex-col items-center shadow-2xl">
            <h3 className="font-display text-4xl tracking-wider text-[#D69A45] mb-1">
              PAUSA NA SESSÃO
            </h3>
            <p className="text-[11px] font-mono-film text-[#E8DFC9]/60 mb-5">
              O FILME ESTÁ CONGELADO NO FOTOGRAMA
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={onTogglePause}
                className="w-full py-2.5 bg-[#D69A45] hover:bg-[#e4a852] text-[#17191D] font-display text-xl tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>CONTINUAR FILMAGEM</span>
              </button>

              <button
                onClick={() => {
                  onTogglePause();
                  openModal('settings');
                }}
                className="w-full py-2 bg-[#2A2E35] hover:bg-[#343942] text-[#E8DFC9] font-mono-film text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>AJUSTES</span>
              </button>

              <button
                onClick={() => {
                  onTogglePause();
                  useGameStore.getState().goToTitle();
                }}
                className="w-full py-2 bg-[#17191D] border border-[#D94B43]/50 hover:bg-[#D94B43]/20 text-[#D94B43] font-mono-film text-xs font-bold rounded transition-colors cursor-pointer"
              >
                VOLTAR AO MENU PRINCIPAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle bottom film sprockets bar */}
      <div className="w-full flex justify-between items-center opacity-20 pointer-events-none px-4">
        <span className="text-[9px] font-mono-film text-[#E8DFC9]">35MM KODAK FILM STOCK — 24 FPS</span>
        <span className="text-[9px] font-mono-film text-[#E8DFC9]">REBOBINAR V1.0 ARCADE</span>
      </div>
    </div>
  );
};
