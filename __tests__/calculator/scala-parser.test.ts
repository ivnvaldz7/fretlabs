import { describe, it, expect } from 'vitest';
import { parseScala, scalaFretDistance, ScalaParseError } from '../../src/modules/calculator/scala-parser';

describe('scala-parser', () => {
  const VALID_12TET_SCL = `! 12tet.scl
!
12 tone equal temperament
12
!
100.0
200.
300.
400.
500.
600.
700.
800.
900.
1000.
1100.
2/1`;

  describe('parseScala', () => {
    it('should parse a valid 12-TET Scala file', () => {
      const scale = parseScala(VALID_12TET_SCL);
      expect(scale.description).toBe('12 tone equal temperament');
      expect(scale.noteCount).toBe(12);
      expect(scale.ratios).toHaveLength(12);
    });

    it('should parse cents values correctly', () => {
      const scale = parseScala(VALID_12TET_SCL);
      // 100 cents = 2^(100/1200) ≈ 1.05946
      expect(scale.ratios[0]).toBeCloseTo(1.05946, 4);
      // 700 cents = perfect fifth ≈ 1.49831
      expect(scale.ratios[6]).toBeCloseTo(1.49831, 4);
    });

    it('should parse ratio values correctly', () => {
      const scale = parseScala(VALID_12TET_SCL);
      // Last value "2/1" = 2.0 (octave)
      expect(scale.ratios[11]).toBe(2);
    });

    it('should handle a simple just intonation scale', () => {
      const justMajor = `! just_major.scl
Just major scale
7
!
9/8
5/4
4/3
3/2
5/3
15/8
2/1`;
      const scale = parseScala(justMajor);
      expect(scale.noteCount).toBe(7);
      expect(scale.ratios[0]).toBeCloseTo(9 / 8, 10); // Major second
      expect(scale.ratios[1]).toBeCloseTo(5 / 4, 10); // Major third
      expect(scale.ratios[3]).toBeCloseTo(3 / 2, 10); // Perfect fifth
      expect(scale.ratios[6]).toBe(2);                  // Octave
    });

    it('should throw ScalaParseError for empty input', () => {
      expect(() => parseScala('')).toThrow(ScalaParseError);
    });

    it('should throw ScalaParseError for mismatched note count', () => {
      const bad = `! bad.scl
Bad scale
5
!
100.0
200.0`;
      expect(() => parseScala(bad)).toThrow(ScalaParseError);
      expect(() => parseScala(bad)).toThrow(/Expected 5/);
    });

    it('should throw ScalaParseError for invalid ratio', () => {
      const bad = `! bad.scl
Bad
1
!
abc/def`;
      expect(() => parseScala(bad)).toThrow(ScalaParseError);
    });
  });

  describe('scalaFretDistance', () => {
    it('fret 0 should always be 0', () => {
      const scale = parseScala(VALID_12TET_SCL);
      expect(scalaFretDistance(647.7, 0, scale)).toBe(0);
    });

    it('12-TET via Scala should match equal temperament calculation', () => {
      const scale = parseScala(VALID_12TET_SCL);
      const scaleMm = 647.7;

      // Fret 12 (octave) should be half scale length
      const fret12 = scalaFretDistance(scaleMm, 12, scale);
      expect(fret12).toBeCloseTo(scaleMm / 2, 1);
    });
  });
});
