import { MOVE_FUNCTIONS } from '../util/stickerMapper.js';
import { canonicalizeCubeRotations, invertAlg, splitMoves } from './algTools.js';

const FACE_STICKERS = {
  U: [0, 1, 2, 3],
  D: [4, 5, 6, 7],
  F: [8, 9, 10, 11],
  B: [12, 13, 14, 15],
  L: [16, 17, 18, 19],
  R: [20, 21, 22, 23],
};

const VISUAL_CUBE_FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];
// VisualCubePlus defaults used by Cubing Pro: U/R/F/D/L/B.
const VISUAL_CUBE_SCHEME = ['fefe00', 'ee0000', '0000f2', 'ffffff', 'ffa100', '00d800'];
const VISUAL_CUBE_URL = 'https://algs.cuber.pro/visualcube/visualcube.php';

function buildStickerState(alg) {
  const stickerPositions = Object.fromEntries(
    Object.entries(FACE_STICKERS).map(([face, positions]) => [face, [...positions]])
  );

  splitMoves(alg).forEach((move) => {
    const moveSticker = MOVE_FUNCTIONS[move];
    if (!moveSticker) {
      throw new Error(`Unsupported 2x2 move in preview: ${move}`);
    }

    Object.keys(stickerPositions).forEach((face) => {
      stickerPositions[face] = stickerPositions[face].map(moveSticker);
    });
  });

  const state = Array(24);
  Object.entries(stickerPositions).forEach(([face, positions]) => {
    positions.forEach((position) => {
      state[position] = face.toLowerCase();
    });
  });
  return state;
}

// csTimer classifies a case in a fixed frame, then reverses the solver result
// to obtain the setup. Do the same here before handing only the sticker state
// to VisualCube, so VisualCube never has to interpret rotations or odd tokens.
export function getCaseSetupAlg(solutionAlg = '') {
  return invertAlg(canonicalizeCubeRotations(solutionAlg));
}

export function getCaseFaceletDefinition(solutionAlg = '') {
  const state = buildStickerState(getCaseSetupAlg(solutionAlg));
  return VISUAL_CUBE_FACE_ORDER
    .flatMap((face) => FACE_STICKERS[face].map((index) => state[index]))
    .join('');
}

export function getAlgorithmFaceletDefinition(algorithm = '') {
  const state = buildStickerState(canonicalizeCubeRotations(algorithm));
  return VISUAL_CUBE_FACE_ORDER
    .flatMap((face) => FACE_STICKERS[face].map((index) => state[index]))
    .join('');
}

export function getVisualCubeCaseUrl(solutionAlg = '', size = 256, options = {}) {
  const { plan = true, algorithm } = options;
  const params = new URLSearchParams({
    fmt: 'png',
    pzl: '2',
    size: String(size),
    r: 'y45x-34',
    fd: algorithm == null
      ? getCaseFaceletDefinition(solutionAlg)
      : getAlgorithmFaceletDefinition(algorithm),
    sch: VISUAL_CUBE_SCHEME.join(','),
    bg: 'ffffff',
  });
  if (plan) params.set('view', 'plan');
  return `${VISUAL_CUBE_URL}?${params.toString()}`;
}
