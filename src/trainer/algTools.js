export function normalizeAlg(alg = '') {
  return String(alg || '').trim().replace(/\s+/g, ' ');
}

export function splitMoves(alg = '') {
  const clean = normalizeAlg(alg);
  return clean ? clean.split(' ').filter(Boolean) : [];
}

export function invertMove(move) {
  if (!move) return '';
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return move.slice(0, -1);
  return `${move}'`;
}

export function invertAlg(alg = '') {
  return splitMoves(alg).reverse().map(invertMove).join(' ');
}

function parseMove(move) {
  if (!move || typeof move !== 'string') return null;

  const match = move.match(/^(.+?)(2|'?)$/);
  if (!match) return null;

  const [, base, suffix] = match;
  const amount = suffix === '2' ? 2 : suffix === "'" ? 3 : 1;
  return { base, amount };
}

function moveFromAmount(base, amount) {
  const normalized = ((amount % 4) + 4) % 4;
  if (normalized === 0) return '';
  if (normalized === 1) return base;
  if (normalized === 2) return `${base}2`;
  return `${base}'`;
}

export function simplifyAlg(alg = '') {
  const stack = [];

  splitMoves(alg).forEach((move) => {
    const current = parseMove(move);
    if (!current) {
      if (move) stack.push(move);
      return;
    }

    const previousMove = stack[stack.length - 1];
    const previous = parseMove(previousMove);

    if (!previous || previous.base !== current.base) {
      stack.push(move);
      return;
    }

    const mergedMove = moveFromAmount(current.base, previous.amount + current.amount);
    stack.pop();

    if (mergedMove) {
      stack.push(mergedMove);
    }
  });

  return stack.join(' ');
}

export function composeTrainingScramble({ setup = '', face = '', alg = '', auf = '' }) {
  const forward = [setup, face, alg, auf].map(normalizeAlg).filter(Boolean).join(' ');
  return simplifyAlg(invertAlg(forward));
}
