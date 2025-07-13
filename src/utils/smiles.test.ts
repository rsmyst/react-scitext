import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  splitSmiles,
  isSmilesCode,
  validateSmilesCode,
  sanitizeSmilesCode,
  extractSmilesCode,
} from './smiles';

describe('smiles utilities', () => {
  describe('splitSmiles', () => {
    test('splits content with SMILES tags', () => {
      const content = 'Benzene <smiles>c1ccccc1</smiles> is aromatic';
      const parts = splitSmiles(content);
      expect(parts).toEqual(['Benzene ', '<smiles>c1ccccc1</smiles>', ' is aromatic']);
    });

    test('handles multiple SMILES', () => {
      const content = 'Benzene <smiles>c1ccccc1</smiles> and methane <smiles>C</smiles>';
      const parts = splitSmiles(content);
      expect(parts).toHaveLength(5);
      expect(parts[1]).toBe('<smiles>c1ccccc1</smiles>');
      expect(parts[3]).toBe('<smiles>C</smiles>');
    });

    test('handles content without SMILES', () => {
      const content = 'No chemistry here';
      const parts = splitSmiles(content);
      expect(parts).toEqual(['No chemistry here']);
    });

    test('handles empty content', () => {
      const parts = splitSmiles('');
      expect(parts).toEqual(['']);
    });
  });

  describe('isSmilesCode', () => {
    test('matches valid SMILES tags', () => {
      const match = isSmilesCode('<smiles>c1ccccc1</smiles>');
      expect(match).toBeTruthy();
      expect(match![1]).toBe('c1ccccc1');
    });

    test('matches empty SMILES tags', () => {
      const match = isSmilesCode('<smiles></smiles>');
      expect(match).toBeTruthy();
      expect(match![1]).toBe('');
    });

    test('does not match malformed tags', () => {
      expect(isSmilesCode('<smiles>c1ccccc1')).toBeNull();
      expect(isSmilesCode('c1ccccc1</smiles>')).toBeNull();
      expect(isSmilesCode('<smile>c1ccccc1</smile>')).toBeNull();
    });

    test('handles multiline SMILES', () => {
      const match = isSmilesCode('<smiles>c1ccccc1\nC</smiles>');
      expect(match).toBeTruthy();
      expect(match![1]).toBe('c1ccccc1\nC');
    });
  });

  describe('validateSmilesCode', () => {
    test('validates correct SMILES codes', () => {
      expect(validateSmilesCode('c1ccccc1')).toBe(true); // benzene
      expect(validateSmilesCode('C')).toBe(true); // methane
      expect(validateSmilesCode('CCO')).toBe(true); // ethanol
      expect(validateSmilesCode('C1CCCCC1')).toBe(true); // cyclohexane
      expect(validateSmilesCode('C=C')).toBe(true); // ethene
      expect(validateSmilesCode('C#C')).toBe(true); // ethyne
    });

    test('validates SMILES with brackets and charges', () => {
      expect(validateSmilesCode('[Na+]')).toBe(true);
      expect(validateSmilesCode('[Cl-]')).toBe(true);
      expect(validateSmilesCode('C[C@H](O)C')).toBe(true);
    });

    test('rejects invalid inputs', () => {
      expect(validateSmilesCode('')).toBe(false);
      expect(validateSmilesCode(null as any)).toBe(false);
      expect(validateSmilesCode(undefined as any)).toBe(false);
      expect(validateSmilesCode(123 as any)).toBe(false);
    });

    test('rejects extremely long SMILES', () => {
      const longSmiles = 'C'.repeat(1001);
      expect(validateSmilesCode(longSmiles)).toBe(false);
    });

    test('rejects SMILES with invalid characters', () => {
      expect(validateSmilesCode('c1ccccc1<script>')).toBe(false);
      expect(validateSmilesCode('C&C')).toBe(false);
      expect(validateSmilesCode('C$C')).toBe(false);
    });

    test('allows valid special characters', () => {
      expect(validateSmilesCode('C1C.C2C')).toBe(true); // dot for disconnected
      expect(validateSmilesCode('C%10C')).toBe(true); // ring closure
    });
  });

  describe('sanitizeSmilesCode', () => {
    test('removes HTML tags', () => {
      const input = 'c1ccccc1<script>alert("xss")</script>';
      const output = sanitizeSmilesCode(input);
      expect(output).toBe('c1ccccc1alert("xss")');
    });

    test('removes javascript protocols', () => {
      const input = 'javascript:alert("xss")c1ccccc1';
      const output = sanitizeSmilesCode(input);
      expect(output).toBe('alert("xss")c1ccccc1');
    });

    test('removes data protocols', () => {
      const input = 'data:text/html,<script>c1ccccc1';
      const output = sanitizeSmilesCode(input);
      expect(output).toBe('text/html,c1ccccc1');
    });

    test('preserves valid SMILES', () => {
      const input = 'c1ccccc1';
      const output = sanitizeSmilesCode(input);
      expect(output).toBe(input);
    });

    test('trims whitespace', () => {
      const input = '  c1ccccc1  ';
      const output = sanitizeSmilesCode(input);
      expect(output).toBe('c1ccccc1');
    });
  });

  describe('extractSmilesCode', () => {
    test('extracts SMILES code from valid fragment', () => {
      const fragment = '<smiles>c1ccccc1</smiles>';
      const code = extractSmilesCode(fragment);
      expect(code).toBe('c1ccccc1');
    });

    test('returns null for invalid fragment', () => {
      const fragment = 'not a smiles tag';
      const code = extractSmilesCode(fragment);
      expect(code).toBeNull();
    });

    test('returns null for malformed fragment', () => {
      const fragment = '<smiles>c1ccccc1';
      const code = extractSmilesCode(fragment);
      expect(code).toBeNull();
    });

    test('handles empty SMILES code', () => {
      const fragment = '<smiles></smiles>';
      const code = extractSmilesCode(fragment);
      expect(code).toBe('');
    });
  });

  // Property-based tests
  describe('property tests', () => {
    test('splitSmiles preserves content', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            const parts = splitSmiles(input);
            const rejoined = parts.join('');
            expect(rejoined).toBe(input);
          }
        )
      );
    });

    test('sanitizeSmilesCode always returns string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            const output = sanitizeSmilesCode(input);
            expect(typeof output).toBe('string');
          }
        )
      );
    });

    test('validateSmilesCode handles edge cases', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          (input) => {
            const result = validateSmilesCode(input as any);
            expect(typeof result).toBe('boolean');
          }
        )
      );
    });
  });
});