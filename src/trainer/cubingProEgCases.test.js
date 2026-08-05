import { CASE_LIBRARY } from './caseLibrary';
import { getCubingProEgScramble } from './cubingProEgCases';
import { getAlgorithmFaceletDefinition } from './cstimerCasePreview';

describe('Cubing Pro EG case references', () => {
  test('covers every local EG case with a valid authoritative scramble', () => {
    Object.entries(CASE_LIBRARY.EG).forEach(([method, cases]) => {
      cases.forEach(({ name, subcase }) => {
        const scramble = getCubingProEgScramble('EG', method, name, subcase);
        expect(scramble).toBeTruthy();
        expect(getAlgorithmFaceletDefinition(scramble)).toMatch(/^[urfdlb]{24}$/);
      });
    });
  });

  test('does not override case states outside the EG method group', () => {
    expect(getCubingProEgScramble('LS', 'LS1', 'Sune', 0)).toBeUndefined();
  });
});
