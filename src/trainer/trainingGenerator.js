import { composeTrainingScramble, normalizeAlg, simplifyAlg } from './algTools';

const AUF_POOL = ['', 'U', "U'", 'U2'];

// 全部 24 种魔方朝向：6 个面做顶 × 4 个前侧
// 配色：白(U)黄(D)绿(F)蓝(B)红(R)橙(L)
// rotation 为打乱开头的整体旋转，让用户先转到该朝向再打乱
export const ORIENTATION_PRESETS = [
  // 白顶
  { name: '白顶绿前', rotation: '' },
  { name: '白顶红前', rotation: 'y' },
  { name: '白顶蓝前', rotation: 'y2' },
  { name: '白顶橙前', rotation: "y'" },
  // 黄顶（x2 翻面，蓝变前）
  { name: '黄顶蓝前', rotation: 'x2' },
  { name: '黄顶红前', rotation: 'x2 y' },
  { name: '黄顶绿前', rotation: 'x2 y2' },
  { name: '黄顶橙前', rotation: "x2 y'" },
  // 绿顶（x 翻面，黄变前）
  { name: '绿顶黄前', rotation: 'x' },
  { name: '绿顶红前', rotation: "x y'" },
  { name: '绿顶白前', rotation: 'x y2' },
  { name: '绿顶橙前', rotation: 'x y' },
  // 蓝顶（x' 翻面，白变前）
  { name: '蓝顶白前', rotation: "x'" },
  { name: '蓝顶红前', rotation: "x' y'" },
  { name: '蓝顶黄前', rotation: "x' y2" },
  { name: '蓝顶橙前', rotation: "x' y" },
  // 红顶（z' 翻面，绿前不变）
  { name: '红顶绿前', rotation: "z'" },
  { name: '红顶白前', rotation: "z' y'" },
  { name: '红顶蓝前', rotation: "z' y2" },
  { name: '红顶黄前', rotation: "z' y" },
  // 橙顶（z 翻面，绿前不变）
  { name: '橙顶绿前', rotation: 'z' },
  { name: '橙顶白前', rotation: "z y'" },
  { name: '橙顶蓝前', rotation: 'z y2' },
  { name: '橙顶黄前', rotation: 'z y' },
];

export function randomAuf() {
  return AUF_POOL[Math.floor(Math.random() * AUF_POOL.length)];
}

export function buildTrainingScramble({
  setup = '',
  base = '',
  alg = '',
  addRandomAuf = true,
  forceTrailingR = false,
  orientation = '',
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
    orientation,
  };
}