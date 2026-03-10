/** Snap a value to the nearest grid increment */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Snap rotation to nearest 45-degree increment */
export function snapRotation(degrees: number): number {
  return Math.round(degrees / 45) * 45;
}

/** Snap scale to nearest 0.25 increment, clamped to [0.25, 4.0] */
export function snapScale(scale: number): number {
  const snapped = Math.round(scale / 0.25) * 0.25;
  return Math.max(0.25, Math.min(4.0, snapped));
}

/** Build an SVG transform string from layer properties */
export function buildTransform(
  x: number,
  y: number,
  scale: number,
  rotation: number,
  mirrorX: boolean,
  mirrorY: boolean
): string {
  // Rune center point in viewBox coordinates (80x160 viewBox)
  const centerX = 40;
  const centerY = 80;

  // Build transform order: translate to position, rotate at center, then scale/mirror
  const transforms: string[] = [];

  // 1. Translate to position
  transforms.push(`translate(${x},${y})`);

  // 2. Rotate around rune center
  if (rotation !== 0) {
    transforms.push(`rotate(${rotation},${centerX},${centerY})`);
  }

  // 3. Scale and mirror at center
  const scaleX = mirrorX ? -scale : scale;
  const scaleY = mirrorY ? -scale : scale;

  if (scaleX !== 1 || scaleY !== 1) {
    transforms.push(`scale(${scaleX},${scaleY})`);
  }

  return transforms.join(' ');
}
