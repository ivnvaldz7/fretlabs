import { describe, it, expect } from 'vitest';
import { extendSegmentToOutline } from '../../src/utils/extend-line-to-outline';
import type { FretboardOutline } from '../../src/modules/calculator/types';

describe('utils/extend-line-to-outline', () => {
  it('extends a segment to the outline boundaries', () => {
    const outline: FretboardOutline = {
      nutFirst: { x: 0, y: 0 },
      nutLast: { x: 0, y: 100 },
      bridgeFirst: { x: 200, y: 0 },
      bridgeLast: { x: 200, y: 100 },
    };

    const seg = extendSegmentToOutline(50, 30, 150, 30, outline);
    expect(seg.y1).toBeCloseTo(30, 10);
    expect(seg.y2).toBeCloseTo(30, 10);
    expect(seg.x1).toBeCloseTo(0, 10);
    expect(seg.x2).toBeCloseTo(200, 10);
  });
});

