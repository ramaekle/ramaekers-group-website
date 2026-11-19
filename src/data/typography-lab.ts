/** Available local faces; explicit mappings avoid synthetic evaluation weights. */
export const labFonts = [
  { name: 'Inter', weights: [400, 500, 600, 700] },
  { name: 'Plus Jakarta Sans', weights: [400, 500, 600, 700, 800] },
  { name: 'Lato', weights: [400, 700, 900] },
  { name: 'Josefin Sans', weights: [400, 500, 600, 700] },
  { name: 'Noto Sans', weights: [400, 500, 600, 700, 800] },
  { name: 'Montserrat', weights: [400, 500, 600, 700, 800] },
  { name: 'Poppins', weights: [400, 500, 600, 700, 800] },
  { name: 'Manrope', weights: [400, 500, 600, 700, 800] },
] as const;

export function availableWeight(family: string, requested: number): number {
  const weights: readonly number[] = labFonts.find(font => font.name === family)?.weights ?? [400];
  // CSS matching for this lab's 400–800 range: 500 searches down before up;
  // weights above 500 search up before down.
  if (weights.includes(requested)) return requested;
  return requested <= 500
    ? [...weights].reverse().find(weight => weight <= requested) ?? weights[0]
    : weights.find(weight => weight >= requested) ?? weights[weights.length - 1];
}
