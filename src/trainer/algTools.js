export function normalizeAlg(alg = '') {
  return String(alg || '')
    .replace(/[’‘`]/g, "'")
    .trim()
    .replace(/\s+/g, ' ');
}

export function splitMoves(alg = '') {
  const clean = normalizeAlg(alg);
  return clean ? clean.split(' ').filter(Boolean) : [];
}

export function invertMove(move) {
  const parsed = parseMove(move);
  if (!parsed) return move || '';
  if (parsed.amount === 2) return `${parsed.base}2`;
  return moveFromAmount(parsed.base, 4 - parsed.amount);
}

export function invertAlg(alg = '') {
  return splitMoves(alg).reverse().map(invertMove).join(' ');
}

function parseMove(move) {
  if (!move || typeof move !== 'string') return null;

  const match = move.match(/^([URFDLBxyzXYZ])(?:(2)'?|('))?$/);
  if (!match) return null;

  const [, rawBase, double, prime] = match;
  const base = /[xyz]/i.test(rawBase) ? rawBase.toLowerCase() : rawBase.toUpperCase();
  const amount = double ? 2 : prime ? 3 : 1;
  return { base, amount };
}

function moveFromAmount(base, amount) {
  const normalized = ((amount % 4) + 4) % 4;
  if (normalized === 0) return '';
  if (normalized === 1) return base;
  if (normalized === 2) return `${base}2`;
  return `${base}'`;
}

const ROTATION_FACE_MAP = {
  x: { U: 'F', D: 'B', F: 'D', B: 'U', L: 'L', R: 'R' },
  y: { U: 'U', D: 'D', F: 'R', B: 'L', L: 'F', R: 'B' },
  z: { U: 'L', D: 'R', F: 'F', B: 'B', L: 'D', R: 'U' },
};

function rotateFaceMap(faceMap, rotation, amount) {
  let next = { ...faceMap };
  for (let turn = 0; turn < amount; turn += 1) {
    const previous = next;
    next = Object.fromEntries(
      Object.keys(previous).map((face) => [face, previous[ROTATION_FACE_MAP[rotation][face]]])
    );
  }
  return next;
}

// csTimer treats x/y/z as a change of grip when classifying a case. Convert
// following face turns back to the fixed U/R/F/D/L/B frame and drop the final
// whole-cube orientation so previews keep a consistent color scheme.
export function canonicalizeCubeRotations(alg = '') {
  let faceMap = { U: 'U', D: 'D', F: 'F', B: 'B', L: 'L', R: 'R' };
  const moves = [];

  splitMoves(alg).forEach((move) => {
    const parsed = parseMove(move);
    if (!parsed) {
      moves.push(move);
      return;
    }

    if (ROTATION_FACE_MAP[parsed.base]) {
      faceMap = rotateFaceMap(faceMap, parsed.base, parsed.amount);
      return;
    }

    moves.push(moveFromAmount(faceMap[parsed.base], parsed.amount));
  });

  return simplifyAlg(moves.join(' '));
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
