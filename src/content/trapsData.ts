import { CauseId } from '../core/types';

export interface TrapDef {
  id: CauseId;
  name: string;
  category: 'editing_error';
  telegraphSeconds: number;
  periodSeconds: number;
  activeSeconds: number;
  width: number;
  height: number;
  description: string;
  tip: string;
}

export const TRAP_DEFS: Record<string, TrapDef> = {
  jump_cut: {
    id: 'jump_cut',
    name: 'Jump Cut',
    category: 'editing_error',
    telegraphSeconds: 0.5,
    periodSeconds: 2.2,
    activeSeconds: 0.8,
    width: 48,
    height: 16,
    description: 'Um corte seco no chão onde o negativo foi tesourado pelo editor em crise.',
    tip: 'Observe o fotograma piscar em preto e branco antes do piso sumir.',
  },
  freeze_frame: {
    id: 'freeze_frame',
    name: 'Freeze Frame',
    category: 'editing_error',
    telegraphSeconds: 0.7,
    periodSeconds: 3.0,
    activeSeconds: 0.5,
    width: 28,
    height: 48,
    description: 'Uma falsa pausa dramática que parece inofensiva até ejetar lâminas de claquete.',
    tip: 'Quando as linhas de scan congelarem ao redor, salte imediatamente.',
  },
  film_scratch: {
    id: 'film_scratch',
    name: 'Risco de Película',
    category: 'editing_error',
    telegraphSeconds: 0.65,
    periodSeconds: 2.5,
    activeSeconds: 0.5,
    width: 14,
    height: 52,
    description: 'Um arranhão violento no acetato que rasga qualquer coisa que o atravesse.',
    tip: 'O risco treme verticalmente e emite faíscas ópticas antes de eletrocutar.',
  },
  rewind_glitch: {
    id: 'rewind_glitch',
    name: 'Glitch de Retrocesso',
    category: 'editing_error',
    telegraphSeconds: 0.3,
    periodSeconds: 2.0,
    activeSeconds: 0.9,
    width: 32,
    height: 32,
    description: 'Reverso óptico que surge quando você corre rápido demais, ressuscitando erros do passado.',
    tip: 'Evite dash desenfreado ao avistar o sensor de velocidade magenta.',
  },
};
