import { describe, it, expect } from 'vitest';
import { generateFloor, isFloorConnected } from './WorldGen.ts';

describe('WorldGen connectivity', () => {
  it.each([1, 2, 3, 4, 5])('floor %i is reachable from spawn to exit', (level) => {
    expect(isFloorConnected(generateFloor(level))).toBe(true);
  });

  it('1000 seeds all produce reachable exits', () => {
    for (let level = 1; level <= 1000; level++) {
      const data = generateFloor(level);
      expect(isFloorConnected(data)).toBe(true);
    }
  });
});
