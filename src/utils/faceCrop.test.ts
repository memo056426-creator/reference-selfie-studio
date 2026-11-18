import { describe, expect, it } from 'vitest';
import { calculateFaceCrop } from './faceCrop';

describe('local face reference crop geometry', () => {
  it('keeps a selected face square inside a portrait photo', () => {
    const crop = calculateFaceCrop(900, 1600, 0.52, 0.22, 0.4);
    expect(crop).toEqual({ x: 288, y: 172, size: 360 });
  });

  it('clamps edge taps and zoom to image boundaries', () => {
    expect(calculateFaceCrop(1200, 700, 0, 0, 0.45)).toEqual({
      x: 0, y: 0, size: 315,
    });
    expect(calculateFaceCrop(1200, 700, 1, 1, 0.45)).toEqual({
      x: 885, y: 385, size: 315,
    });
  });

  it('bounds the crop in small images and rejects invalid dimensions', () => {
    expect(calculateFaceCrop(80, 80, 0.5, 0.5, 0.9)).toEqual({
      x: 6, y: 6, size: 68,
    });
    expect(calculateFaceCrop(1, 1)).toEqual({ x: 0, y: 0, size: 1 });
    expect(calculateFaceCrop(0, 100)).toBeNull();
    expect(calculateFaceCrop(Number.NaN, 100)).toBeNull();
  });

  it('limits invalid normalized positions and crop sizes safely', () => {
    const crop = calculateFaceCrop(1000, 500, Number.POSITIVE_INFINITY, -5, Number.NaN);
    expect(crop).toEqual({ x: 0, y: 0, size: 100 });
  });
});
