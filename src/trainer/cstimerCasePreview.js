const C_FACELET = [
  [3, 4, 9],
  [1, 20, 5],
  [2, 8, 17],
  [0, 16, 21],
];

const LL_FACES = [0, 1, 2, 3, 8, 9, 4, 5, 20, 21, 16, 17];

const EGLL_CASES = {
  H: [0x3210, 0x1221],
  L: [0x0312, 0x0210],
  Pi: [0x3210, 0x1212],
  Sune: [0x3210, 0x2220],
  AntiSune: [0x3210, 0x1011],
  T: [0x2310, 0x1020],
  U: [0x0213, 0x2010],
  PBL: [0x3210, 0x0000],
};

const TCLL_PLUS_CASES = {
  Hammer: [0x0123, 0x0221],
  Spaceship: [0x0123, 0x1022],
  Stollery: [0x2031, 0x0002],
  Pinwheel: [0x0123, 0x2222],
  TwoFace: [0x2031, 0x0110],
  Turtle: [0x1302, 0x0122],
  Gun: [0x2031, 0x0011],
};

const TCLL_MINUS_CASES = {
  Hammer: [0x1302, 0x1201],
  Spaceship: [0x0123, 0x1012],
  Stollery: [0x0123, 0x0001],
  Pinwheel: [0x0123, 0x1111],
  TwoFace: [0x2031, 0x2002],
  Turtle: [0x2031, 0x1102],
  Gun: [0x0123, 0x0022],
};

const LS_CASES = {
  LS1: 0x00000,
  LS2: 0x10221,
  LS3: 0x20112,
  LS4: 0x02022,
  LS5: 0x12012,
  LS6: 0x22110,
  LS7: 0x01011,
  LS8: 0x11220,
  LS9: 0x21201,
};

const COLOR_BY_CODE = {
  U: '#ffd84d',
  D: '#f7f9fc',
  L: '#ff8a2a',
  F: '#27ae60',
  R: '#e33b35',
  B: '#2f78d4',
  G: '#95a5a6',
};

function detectFamily(name) {
  const normalized = (name || '').toLowerCase();
  if (normalized.includes('anti') || normalized.includes('asune') || normalized.includes('as-')) return 'AntiSune';
  if (normalized.includes('sune')) return 'Sune';
  if (normalized.includes('pi')) return 'Pi';
  if (normalized.includes('hammer')) return 'Hammer';
  if (normalized.includes('spaceship')) return 'Spaceship';
  if (normalized.includes('stollery')) return 'Stollery';
  if (normalized.includes('pinwheel')) return 'Pinwheel';
  if (normalized.includes('two') || normalized.includes('2face') || normalized.includes('face')) return 'TwoFace';
  if (normalized.includes('turtle')) return 'Turtle';
  if (normalized.includes('gun')) return 'Gun';
  if (normalized.includes('u-')) return 'U';
  if (normalized.includes('l-')) return 'L';
  if (normalized.includes('t-')) return 'T';
  if (normalized.includes('h-')) return 'H';
  return 'PBL';
}

function getLLFace(type, llcase) {
  const llface = [];

  for (let i = 0; i < 4; i += 1) {
    if (type === 'ls') {
      const ori = (llcase >> (i << 2)) & 0xf;
      for (let j = 0; j < 3; j += 1) {
        const pos = LL_FACES.indexOf(C_FACELET[i][j]);
        llface[pos] = 'DGU'.charAt((j + 3 - ori) % 3 === 0 ? (i === 3 ? 2 : 0) : 1);
      }
    } else {
      const perm = (llcase[0] >> (i << 2)) & 0xf;
      const ori = (llcase[1] >> (i << 2)) & 0xf;
      const cols = type === 'ori' ? 'DGGUGG' : 'DLFURB';
      for (let j = 0; j < 3; j += 1) {
        const pos = LL_FACES.indexOf(C_FACELET[i][j]);
        llface[pos] = cols.charAt(C_FACELET[perm][(j + 3 - ori) % 3] >> 2);
      }
    }
  }

  return llface.map((code) => code || 'G');
}

export function getCstimerCasePreview(methodGroup, method, name) {
  if (methodGroup === 'LS') {
    const lsKey = method && LS_CASES[method] != null ? method : 'LS1';
    return getLLFace('ls', LS_CASES[lsKey]);
  }

  const family = detectFamily(name);
  if (methodGroup === 'TCLL') {
    const table = method === 'TCLL-' ? TCLL_MINUS_CASES : TCLL_PLUS_CASES;
    return getLLFace('all', table[family] || table.Hammer);
  }

  return getLLFace('all', EGLL_CASES[family] || EGLL_CASES.PBL);
}

export function getPreviewColor(code) {
  return COLOR_BY_CODE[code] || COLOR_BY_CODE.G;
}
