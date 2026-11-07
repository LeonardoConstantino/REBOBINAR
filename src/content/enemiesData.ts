export interface EnemyDef {
  id: string;
  name: string;
  category: 'unruly_extra';
  speed: number;
  patrolRange: number;
  width: number;
  height: number;
  description: string;
  tip: string;
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  rebel_extra: {
    id: 'rebel_extra',
    name: 'Figurante Rebelde',
    category: 'unruly_extra',
    speed: 70,
    patrolRange: 96,
    width: 16,
    height: 22,
    description: 'Um ator de fundo mal pago que se recusa a seguir a marcação de cena no chão.',
    tip: 'Ele patrulha uma rota fixa balançando uma claquete afiada. Salte por cima dele.',
  },
  ghost_double: {
    id: 'ghost_double',
    name: 'Dublê Fantasma',
    category: 'unruly_extra',
    speed: 130,
    patrolRange: 160,
    width: 16,
    height: 22,
    description: 'A projeção espectral de uma tomada anterior que repete seus próprios movimentos de 2 segundos atrás.',
    tip: 'Ele tem 2 segundos de atraso espelhando suas decisões. Quebre o ritmo para despistá-lo.',
  },
};
