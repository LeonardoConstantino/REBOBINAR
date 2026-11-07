import { ModeId } from '../core/types';

export interface ModeConfig {
  id: ModeId;
  name: string;
  subtitle: string;
  badge: string;
  coyoteSeconds: number;
  bufferSeconds: number;
  initialDensity: number;
  growthPer100m: number;
  aggressivePatternsStartMeters: number;
  hasRetake: boolean;
  rewindDurationMs: number;
  rewindHasFade: boolean;
  hasExclusiveTraps: boolean;
  description: string;
  paletteAccent: string;
}

export const MODES: Record<ModeId, ModeConfig> = {
  studio: {
    id: 'studio',
    name: 'Corte do Estúdio',
    subtitle: 'Versão de exibição testada para o público geral',
    badge: 'ESTÚDIO A',
    coyoteSeconds: 0.12,
    bufferSeconds: 0.10,
    initialDensity: 1.0,
    growthPer100m: 0.04,
    aggressivePatternsStartMeters: 600,
    hasRetake: true,
    rewindDurationMs: 900,
    rewindHasFade: true,
    hasExclusiveTraps: false,
    description: 'Janelas generosas de coyote time e buffer. Rebobinar com fade suave e Retomada ativa.',
    paletteAccent: '#D69A45', // Âmbar de Projetor
  },
  director: {
    id: 'director',
    name: 'Corte do Diretor',
    subtitle: 'A visão autoral sem cortes do montador-chefe',
    badge: 'DIRECTOR CUT',
    coyoteSeconds: 0.10,
    bufferSeconds: 0.08,
    initialDensity: 1.3,
    growthPer100m: 0.06,
    aggressivePatternsStartMeters: 200,
    hasRetake: true,
    rewindDurationMs: 500,
    rewindHasFade: true,
    hasExclusiveTraps: false,
    description: 'Maior densidade de perigos, rebobinar rápido (500ms) e padrões agressivos desde 200m.',
    paletteAccent: '#42BFC2', // Ciano de Monitor
  },
  censored: {
    id: 'censored',
    name: 'Rolo Censurado',
    subtitle: 'Material confidencial resgatado do descarte. Sem concessões.',
    badge: 'CENSURADO 18+',
    coyoteSeconds: 0.08,
    bufferSeconds: 0.06,
    initialDensity: 1.6,
    growthPer100m: 0.10,
    aggressivePatternsStartMeters: 0,
    hasRetake: false,
    rewindDurationMs: 0, // Instantâneo! ≤1 frame
    rewindHasFade: false,
    hasExclusiveTraps: true,
    description: 'Sem Retomada. Rebobinar instantâneo em 0ms. Perigos milimétricos e armadilhas exclusivas.',
    paletteAccent: '#D94B43', // Vermelho de REC
  },
};
