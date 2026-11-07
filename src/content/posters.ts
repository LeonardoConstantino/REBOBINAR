import { RunStats } from '../core/types';

const TITLE_PREFIXES = [
  'A Última Tomada de',
  'O Desastre Sem Fim de',
  'Corte Brusco em',
  'O Homem Que Tropeçou em',
  'Crônica de Uma Morte em',
  'A Vingança do Acetato em',
  'Festival da Claquete Quebrada em',
  'Ensaio Sobre o Fracasso em',
  'Perdidos na Ilha de Edição de',
  'A Fuga Impossível de',
];

const TITLE_SUFFIXES = [
  'Hollywood',
  'Cinecittà',
  '60 Quadros por Segundo',
  'Película Raspada',
  '35 Milímetros',
  'Sala de Projeção B',
  'Fita Rebobinada',
  'Cinema Novo',
  'Negativo Rasgado',
  'Câmera Lenta',
];

const REVIEWS = [
  { quote: 'Um triunfo do masoquismo estético. O diretor não aprendeu nada, mas repetiu com maestria.', author: 'Cahiers du Cinéma' },
  { quote: 'Três metros de genialidade seguidos de uma queda humilhante. Obra-prima do cinema mudo.', author: 'Variety' },
  { quote: 'O figurante rebelde merece um prêmio póstumo por insubordinação cênica.', author: 'Festival de Cannes (Sessão da Meia-Noite)' },
  { quote: 'A claquete quebrou na 14ª tomada, mas a teimosia continuou rodando.', author: 'Gazeta da Película' },
  { quote: 'Inovador: transformou o ato de morrer num exercício de montagem soviética.', author: 'Revista Fotograma' },
  { quote: 'A Edição Final respirava no pescoço do protagonista. Suspense puro sem diálogos.', author: 'Caderno B' },
  { quote: 'Nenhum dublê foi ferido, exceto o orgulho de quem segurava os controles.', author: 'Cinema & Sucata' },
];

export function generatePosterData(stats: RunStats) {
  // Deterministic index selection based on distance + takes + mode
  const seed = Math.floor(stats.distanceMeters * 37 + stats.takesCount * 13 + (stats.deathBucket || 0) * 19);
  const pIndex = Math.abs(seed) % TITLE_PREFIXES.length;
  const sIndex = Math.abs(seed * 7 + 11) % TITLE_SUFFIXES.length;
  const rIndex = Math.abs(seed * 13 + 5) % REVIEWS.length;

  let customTitle = `${TITLE_PREFIXES[pIndex]} ${TITLE_SUFFIXES[sIndex]}`;
  if (stats.takesCount > 15) {
    customTitle = `Tomada ${stats.takesCount}: O Calvário dos ${Math.floor(stats.distanceMeters)} Metros`;
  } else if (stats.distanceMeters > 500) {
    customTitle = `O Longa-Metragem Improvável dos ${Math.floor(stats.distanceMeters)}m`;
  }

  const review = REVIEWS[rIndex];

  return {
    title: customTitle,
    reviewQuote: review.quote,
    reviewAuthor: review.author,
    director: 'Você & A Falta de Orçamento',
    rating: stats.distanceMeters > 300 ? '★★★★☆' : '★★★☆☆',
    classification: stats.mode === 'censored' ? '18+ NÃO RECOMENDADO' : stats.mode === 'director' ? '14+ CORTES FORTES' : 'LIVRE PARA TODOS',
  };
}
