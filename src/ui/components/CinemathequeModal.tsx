import React, { useState } from 'react';
import { useGameStore } from '../store';
import { TRAP_DEFS } from '../../content/trapsData';
import { ENEMY_DEFS } from '../../content/enemiesData';
import { POWERUP_DEFS } from '../../content/powerupsData';
import { MODES } from '../../content/modes';
import { X, BookOpen, Film, Award, Archive, Zap, Skull, ShieldAlert } from 'lucide-react';

type Tab = 'codex' | 'filmography' | 'badges' | 'reels';

export const CinemathequeModal: React.FC = () => {
  const { activeModal, closeModal, takesCount, bestDistanceMeters, mode } = useGameStore();
  const [currentTab, setCurrentTab] = useState<Tab>('codex');

  if (activeModal !== 'cinematheque') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto select-none">
      <div className="relative bg-[#17191D] border-2 border-[#E8DFC9]/30 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-[#E8DFC9]/20 flex items-center justify-between bg-[#1D2127]">
          <div>
            <h2 className="font-display text-2xl tracking-wider text-[#D69A45]">
              CINEMATECA MUNICIPAL DA PELÍCULA
            </h2>
            <p className="text-[11px] font-mono-film text-[#E8DFC9]/60">
              ARQUIVO HISTÓRICO • DOCUMENTAÇÃO SEM PODER ADICIONAL
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 bg-[#2A2E35] text-[#E8DFC9] hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8DFC9]/20 bg-[#17191D]">
          <button
            onClick={() => setCurrentTab('codex')}
            className={`flex-1 py-2.5 text-xs font-mono-film font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              currentTab === 'codex'
                ? 'border-[#D69A45] text-[#D69A45] bg-[#D69A45]/10'
                : 'border-transparent text-[#E8DFC9]/60 hover:text-[#E8DFC9]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            ACERVO
          </button>
          <button
            onClick={() => setCurrentTab('filmography')}
            className={`flex-1 py-2.5 text-xs font-mono-film font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              currentTab === 'filmography'
                ? 'border-[#D69A45] text-[#D69A45] bg-[#D69A45]/10'
                : 'border-transparent text-[#E8DFC9]/60 hover:text-[#E8DFC9]'
            }`}
          >
            <Film className="w-4 h-4" />
            FILMOGRAFIA
          </button>
          <button
            onClick={() => setCurrentTab('badges')}
            className={`flex-1 py-2.5 text-xs font-mono-film font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              currentTab === 'badges'
                ? 'border-[#D69A45] text-[#D69A45] bg-[#D69A45]/10'
                : 'border-transparent text-[#E8DFC9]/60 hover:text-[#E8DFC9]'
            }`}
          >
            <Award className="w-4 h-4" />
            SELOS
          </button>
          <button
            onClick={() => setCurrentTab('reels')}
            className={`flex-1 py-2.5 text-xs font-mono-film font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              currentTab === 'reels'
                ? 'border-[#D69A45] text-[#D69A45] bg-[#D69A45]/10'
                : 'border-transparent text-[#E8DFC9]/60 hover:text-[#E8DFC9]'
            }`}
          >
            <Archive className="w-4 h-4" />
            FITAS ARQUIVADAS
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {currentTab === 'codex' && (
            <div className="space-y-6">
              {/* Erros de Edição */}
              <div>
                <h3 className="font-display text-lg text-[#D94B43] flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  ERROS DE EDIÇÃO (ARMADILHAS)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(TRAP_DEFS).map((trap) => (
                    <div
                      key={trap.id}
                      className="p-3 bg-[#1D2127] border border-[#E8DFC9]/15 rounded-sm hover:border-[#D94B43]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono-film font-bold text-sm text-[#E8DFC9]">
                          {trap.name}
                        </span>
                        <span className="text-[10px] font-mono-film text-[#D94B43] px-1.5 py-0.5 bg-[#D94B43]/15 rounded">
                          {trap.periodSeconds}s CICLO
                        </span>
                      </div>
                      <p className="text-xs text-[#E8DFC9]/80 mb-2">{trap.description}</p>
                      <div className="text-[11px] font-mono-film text-[#D69A45] bg-[#D69A45]/10 p-1.5 rounded">
                        💡 DICA: {trap.tip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Figurantes */}
              <div>
                <h3 className="font-display text-lg text-[#42BFC2] flex items-center gap-2 mb-2">
                  <Skull className="w-4 h-4" />
                  FIGURANTES FORA DE CONTROLE (INIMIGOS)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(ENEMY_DEFS).map((enemy) => (
                    <div
                      key={enemy.id}
                      className="p-3 bg-[#1D2127] border border-[#E8DFC9]/15 rounded-sm hover:border-[#42BFC2]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono-film font-bold text-sm text-[#E8DFC9]">
                          {enemy.name}
                        </span>
                        <span className="text-[10px] font-mono-film text-[#42BFC2] px-1.5 py-0.5 bg-[#42BFC2]/15 rounded">
                          {enemy.speed} u/s
                        </span>
                      </div>
                      <p className="text-xs text-[#E8DFC9]/80 mb-2">{enemy.description}</p>
                      <div className="text-[11px] font-mono-film text-[#42BFC2] bg-[#42BFC2]/10 p-1.5 rounded">
                        💡 DICA: {enemy.tip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ferramentas de Diretor */}
              <div>
                <h3 className="font-display text-lg text-[#D69A45] flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4" />
                  FERRAMENTAS DE DIRETOR (POWER-UPS)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.values(POWERUP_DEFS).map((pw) => (
                    <div
                      key={pw.id}
                      className="p-3 bg-[#1D2127] border border-[#E8DFC9]/15 rounded-sm hover:border-[#D69A45]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono-film font-bold text-xs text-[#E8DFC9]">
                          {pw.name}
                        </span>
                        <span className="text-[9px] font-mono-film text-[#D69A45] px-1.5 py-0.5 bg-[#D69A45]/15 rounded">
                          {pw.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#E8DFC9]/80 mb-2">{pw.description}</p>
                      <div className="text-[10px] font-mono-film text-[#D69A45] bg-[#D69A45]/10 p-1.5 rounded">
                        {pw.tip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'filmography' && (
            <div className="space-y-4">
              <div className="bg-[#1D2127] p-4 rounded-sm border border-[#E8DFC9]/20">
                <h4 className="font-display text-xl text-[#D69A45] mb-2">REGISTRO DA SESSÃO ATUAL</h4>
                <div className="grid grid-cols-3 gap-3 font-mono-film text-center">
                  <div className="p-2 bg-black/40 rounded">
                    <span className="text-[10px] text-[#E8DFC9]/50 block">MODO ATIVO</span>
                    <span className="text-sm font-bold text-[#E8DFC9]">{MODES[mode].name}</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded">
                    <span className="text-[10px] text-[#E8DFC9]/50 block">TOMADAS TOTAIS</span>
                    <span className="text-sm font-bold text-[#D69A45]">×{takesCount}</span>
                  </div>
                  <div className="p-2 bg-black/40 rounded">
                    <span className="text-[10px] text-[#E8DFC9]/50 block">MELHOR DISTÂNCIA</span>
                    <span className="text-sm font-bold text-[#42BFC2]">{Math.floor(bestDistanceMeters)}m</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#E8DFC9]/15 p-4 rounded-sm">
                <h5 className="font-mono-film font-bold text-xs text-[#E8DFC9] mb-2">FILOSOFIA DA ILHA DE MONTAGEM</h5>
                <p className="text-xs text-[#E8DFC9]/70 leading-relaxed">
                  Em REBOBINAR, a morte não é um fim punitivo, mas a tomada que deu errado. Cada rebobinamento preserva as marcas de claquete no chão, construindo o mapa geográfico dos seus erros passados.
                </p>
              </div>
            </div>
          )}

          {currentTab === 'badges' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-[#1D2127] border border-[#D69A45]/40 rounded-sm flex items-start gap-3">
                <span className="text-2xl">🎬</span>
                <div>
                  <h4 className="font-mono-film font-bold text-sm text-[#D69A45]">Teimoso</h4>
                  <p className="text-xs text-[#E8DFC9]/70">Morreu mais de 5 vezes no mesmo trecho de 4 metros.</p>
                  <span className="text-[10px] font-mono-film text-[#91B66B] mt-1 inline-block">✓ DESBLOQUEADO</span>
                </div>
              </div>

              <div className="p-3 bg-[#1D2127] border border-[#42BFC2]/40 rounded-sm flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-mono-film font-bold text-sm text-[#42BFC2]">Sem Cortes</h4>
                  <p className="text-xs text-[#E8DFC9]/70">Alcançou 300 metros sem utilizar nenhuma Retomada.</p>
                  <span className="text-[10px] font-mono-film text-[#D69A45] mt-1 inline-block">EM PROGRESSO</span>
                </div>
              </div>

              <div className="p-3 bg-[#1D2127] border border-[#E8DFC9]/20 rounded-sm flex items-start gap-3">
                <span className="text-2xl">📽️</span>
                <div>
                  <h4 className="font-mono-film font-bold text-sm text-[#E8DFC9]">Diretor de Ouro</h4>
                  <p className="text-xs text-[#E8DFC9]/70">Atravessou 100m sob o efeito da Fita Dourada sem falhar.</p>
                  <span className="text-[10px] font-mono-film text-[#D69A45] mt-1 inline-block">EM PROGRESSO</span>
                </div>
              </div>

              <div className="p-3 bg-[#1D2127] border border-[#E8DFC9]/20 rounded-sm flex items-start gap-3">
                <span className="text-2xl">🎞️</span>
                <div>
                  <h4 className="font-mono-film font-bold text-sm text-[#E8DFC9]">Cineasta Noturno</h4>
                  <p className="text-xs text-[#E8DFC9]/70">Sobreviveu à pressão máxima da Edição Final por 15 segundos.</p>
                  <span className="text-[10px] font-mono-film text-[#D69A45] mt-1 inline-block">EM PROGRESSO</span>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'reels' && (
            <div className="p-4 bg-[#1D2127] border border-[#E8DFC9]/15 rounded-sm space-y-3">
              <h4 className="font-display text-xl text-[#D69A45]">CORREDOR ATUAL (SEED PERSISTENTE)</h4>
              <p className="text-xs text-[#E8DFC9]/80">
                Cada modo de jogo possui sua própria semente permanente para que as marcas de claquete correspondam exatamente aos mesmos obstáculos físicos ao longo do tempo.
              </p>
              <div className="font-mono-film text-xs bg-black/50 p-2.5 rounded border border-[#E8DFC9]/10">
                SEED DO MODO {mode.toUpperCase()}: <span className="text-[#D69A45]">198402</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
