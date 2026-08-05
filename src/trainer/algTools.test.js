import { canonicalizeCubeRotations, invertAlg, invertMove, normalizeAlg } from './algTools';

describe('2x2 algorithm normalization', () => {
  test('normalizes prime characters and double-turn primes', () => {
    expect(normalizeAlg("  R2'   U’ ")).toBe("R2' U'");
    expect(invertMove("R2'")).toBe('R2');
    expect(invertAlg("R2' U’")).toBe("U R2");
  });

  test('removes cube rotations in the fixed csTimer frame', () => {
    expect(canonicalizeCubeRotations("y R U R'")).toBe("B U B'");
    expect(canonicalizeCubeRotations("y R y'")).toBe('B');
    expect(canonicalizeCubeRotations("x U x'")).toBe('F');
    expect(canonicalizeCubeRotations("z R z'")).toBe('U');
  });
});
