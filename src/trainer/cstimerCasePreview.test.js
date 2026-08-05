import {
  getAlgorithmFaceletDefinition,
  getCaseFaceletDefinition,
  getCaseSetupAlg,
  getVisualCubeCaseUrl,
} from './cstimerCasePreview';
import { CASE_LIBRARY } from './caseLibrary';

describe('csTimer-style 2x2 case previews', () => {
  test('uses the inverse of the rotation-normalized solution', () => {
    expect(getCaseSetupAlg("y R U R'")).toBe("B U' B'");
  });

  test('creates a complete VisualCube facelet definition', () => {
    const facelets = getCaseFaceletDefinition("R U R'");
    expect(facelets).toHaveLength(24);
    expect(facelets).toMatch(/^[urfdlb]+$/);
    expect([...facelets].filter((face) => face === 'u')).toHaveLength(4);
    expect([...facelets].filter((face) => face === 'r')).toHaveLength(4);
    expect([...facelets].filter((face) => face === 'f')).toHaveLength(4);
    expect([...facelets].filter((face) => face === 'd')).toHaveLength(4);
    expect([...facelets].filter((face) => face === 'l')).toHaveLength(4);
    expect([...facelets].filter((face) => face === 'b')).toHaveLength(4);
  });

  test('passes the computed state to VisualCube instead of the formula text', () => {
    const url = new URL(getVisualCubeCaseUrl("y R2' U R'"));
    expect(url.searchParams.get('pzl')).toBe('2');
    expect(url.searchParams.get('case')).toBeNull();
    expect(url.searchParams.get('fd')).toHaveLength(24);
    expect(url.searchParams.get('view')).toBe('plan');
    expect(url.searchParams.get('sch')).toBe('fefe00,ee0000,0000f2,ffffff,ffa100,00d800');
  });

  test('keeps PBL previews in the three-face perspective used by Cubing Pro', () => {
    const url = new URL(getVisualCubeCaseUrl("R2 U' R2", 256, { plan: false }));
    expect(url.searchParams.get('view')).toBeNull();
    expect(url.searchParams.get('r')).toBe('y45x-34');
  });

  test('can render an authoritative Cubing Pro scramble without inverting it again', () => {
    const scramble = "R F2 R' F' U F' R'";
    const url = new URL(getVisualCubeCaseUrl('', 256, { algorithm: scramble }));
    expect(url.searchParams.get('fd')).toBe(getAlgorithmFaceletDefinition(scramble));
  });

  test('converts every formula in the case library to a valid 2x2 state', () => {
    Object.values(CASE_LIBRARY).forEach((methods) => {
      Object.values(methods).forEach((cases) => {
        cases.forEach(({ alg }) => {
          const facelets = getCaseFaceletDefinition(alg);
          expect(facelets).toMatch(/^[urfdlb]{24}$/);
          ['u', 'r', 'f', 'd', 'l', 'b'].forEach((face) => {
            expect([...facelets].filter((value) => value === face)).toHaveLength(4);
          });
        });
      });
    });
  });
});
