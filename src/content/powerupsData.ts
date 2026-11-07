import { PowerupId } from '../core/types';

export interface PowerupDef {
  id: PowerupId;
  name: string;
  category: 'director_tool';
  durationSeconds: number;
  description: string;
  badge: string;
  tip: string;
}

export const POWERUP_DEFS: Record<PowerupId, PowerupDef> = {
  slow_cam: {
    id: 'slow_cam',
    name: 'Câmera Lenta',
    category: 'director_tool',
    durationSeconds: 3.0,
    badge: '120 FPS',
    description: 'Roda o mundo a 60% da velocidade normal, concedendo precisão cirúrgica.',
    tip: 'Ideal para saltos milimétricos em gaps com armadilhas sequenciais.',
  },
  still_frame: {
    id: 'still_frame',
    name: 'Fotograma Congelado',
    category: 'director_tool',
    durationSeconds: 4.0,
    badge: 'PAUSE',
    description: 'Congela instantaneamente perigos e inimigos na tela por 4 segundos.',
    tip: 'Permite passar por armadilhas ativas e passar por cima de figurantes paralisados.',
  },
  golden_tape: {
    id: 'golden_tape',
    name: 'Fita Dourada',
    category: 'director_tool',
    durationSeconds: 12.0,
    badge: 'OURO ×2',
    description: 'Multiplica a contagem de metros por 2x, mas DESATIVA a Retomada durante o uso!',
    tip: 'Alto risco, alto prestígio. Uma falha aqui resulta em rebobinamento total.',
  },
};
