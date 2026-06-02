// Filtro simples de palavrões PT-BR para o chat da partida.
// Substitui o miolo da palavra por asteriscos, preservando 1ª e última letra.

const BAD_WORDS = [
  'merda', 'bosta', 'porra', 'caralho', 'crl', 'pqp',
  'puta', 'puta que pariu', 'puto', 'putaria', 'viado', 'viadinho',
  'corno', 'cu', 'cuzao', 'cuzão', 'arrombado', 'arrombada',
  'desgraça', 'desgracado', 'desgraçado', 'fdp', 'filho da puta',
  'foder', 'fodase', 'foda-se', 'fudido', 'fudida', 'buceta', 'boceta',
  'piroca', 'pau no cu', 'punheta', 'babaca', 'otario', 'otário',
  'idiota', 'imbecil', 'retardado', 'mongoloide', 'escroto', 'vagabundo',
  'vagabunda', 'piranha', 'safado', 'safada', 'caceta', 'cacete',
  'bicha', 'baitola', 'veado', 'macaco', 'lixo humano',
];

// Normaliza para comparação (sem acento, minúsculo)
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const censor = (word: string) => {
  if (word.length <= 2) return '*'.repeat(word.length);
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
};

const BAD_SET = new Set(BAD_WORDS.map(normalize));
// Frases compostas (com espaço) tratadas por replace direto
const BAD_PHRASES = BAD_WORDS.filter((w) => w.includes(' '));

export function filterProfanity(text: string): string {
  let result = text;

  for (const phrase of BAD_PHRASES) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, (m) => censor(m.replace(/\s/g, '')));
  }

  result = result.replace(/[a-zA-ZÀ-ÿ]+/g, (word) => {
    if (BAD_SET.has(normalize(word))) return censor(word);
    return word;
  });

  return result;
}

export const hasProfanity = (text: string): boolean => {
  const words = normalize(text).split(/[^a-z]+/);
  if (words.some((w) => BAD_SET.has(w))) return true;
  const norm = normalize(text);
  return BAD_PHRASES.some((p) => norm.includes(normalize(p)));
};
