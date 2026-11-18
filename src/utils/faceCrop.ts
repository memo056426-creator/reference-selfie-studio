/**
 * Crop geometry only. No face recognition or upload occurs here.
 * The user selects the facial region manually so the original photo remains intact.
 */
export interface SquareCrop {
  x: number;
  y: number;
  size: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function calculateFaceCrop(
  imageWidth: number,
  imageHeight: number,
  centerX = 0.5,
  centerY = 0.3,
  fractionOfShortSide = 0.45
): SquareCrop | null {
  if (
    !Number.isFinite(imageWidth) ||
    !Number.isFinite(imageHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return null;
  }
  const width = Math.floor(imageWidth);
  const height = Math.floor(imageHeight);
  const shortSide = Math.min(width, height);
  if (shortSide < 1) return null;

  const size = Math.max(
    1,
    Math.min(shortSide, Math.round(shortSide * clamp(fractionOfShortSide, 0.2, 0.85)))
  );
  const x = Math.round(clamp(centerX, 0, 1) * width - size / 2);
  const y = Math.round(clamp(centerY, 0, 1) * height - size / 2);

  return {
    x: clamp(x, 0, width - size),
    y: clamp(y, 0, height - size),
    size,
  };
}
