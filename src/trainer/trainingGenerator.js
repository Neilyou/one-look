import { composeTrainingScramble, normalizeAlg, simplifyAlg } from './algTools';

const AUF_POOL = ['', 'U', "U'", 'U2'];

export function randomAuf() {
  return AUF_POOL[Math.floor(Math.random() * AUF_POOL.length)];
}

export function buildTrainingScramble({
  setup = '',
  base = '',
  alg = '',
  addRandomAuf = true,
  forceTrailingR = false,
}) {
  const auf = addRandomAuf ? randomAuf() : '';
  let scramble = composeTrainingScramble({ setup, face: base, alg, auf });
  if (forceTrailingR) {
    scramble = `${normalizeAlg(scramble)} R`.trim();
  }
  scramble = simplifyAlg(scramble);

  return {
    scramble,
    forward: simplifyAlg([setup, base, alg, auf].filter(Boolean).join(' ')),
    auf,
  };
}