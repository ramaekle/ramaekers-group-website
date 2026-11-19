export const HERO_EXPERIMENT_ID = 'trg-home-hero-v1';
export const HERO_EXPERIMENT_NAME = 'TRG Homepage Hero — Round 1';
export const HERO_VARIANT_IDS = ['A', 'B', 'C', 'D'] as const;
export type HeroVariantId = typeof HERO_VARIANT_IDS[number];
export interface HeroVariant {
  id: HeroVariantId;
  label: string;
  eyebrow: string;
  headline: string;
  italic: string;
  paragraph: string;
  /** Base path; files are `${imagePath}-${width}.avif|webp` for each HERO_IMAGE_WIDTHS entry. */
  imagePath: string;
  focalPoint: { mobile: string; desktop: string };
}
export const heroVariants: Record<HeroVariantId, HeroVariant> = {
  A: {
    id: 'A', label: 'Operations first',
    eyebrow: 'Turnaround · Restructuring · Performance Improvement',
    headline: 'Improve the operation.', italic: 'The cash and margins follow.',
    paragraph: 'Ramaekers Group works with owners and CEOs to find where cash and margin slip out of the business, then fixes it in the operations where it starts. Pricing, working capital, cost, and execution are corrected in order of dollars recovered.',
    imagePath: '/images/heroes/operations',
    focalPoint: { mobile: '60% 50%', desktop: 'center top' },
  },
  B: {
    id: 'B', label: 'Principal-led',
    eyebrow: 'Hands-on Operational and Financial Leadership',
    headline: 'Senior judgment at the table.', italic: 'Hands-on execution in the business.',
    paragraph: 'Larry Ramaekers leads the engagement, bringing financial analysis and operational judgment directly to the decisions that matter. He works alongside owners, executives, and their teams to identify performance gaps and implement practical solutions, supported by specialist resources when needed.',
    imagePath: '/images/heroes/principal-led',
    focalPoint: { mobile: '65% 45%', desktop: 'center top' },
  },
  C: {
    id: 'C', label: 'Under pressure',
    eyebrow: 'Turnaround and Interim Management',
    headline: 'When cash gets tight,', italic: 'every week counts.',
    paragraph: 'Losses, a lender losing patience, a major customer gone. Ramaekers Group steps in to take control of cash, stabilize the operation, and restore margin—as an advisor or as interim leadership. We act before your options start to narrow.',
    imagePath: '/images/heroes/under-pressure',
    focalPoint: { mobile: '90% 50%', desktop: 'center bottom' },
  },
  D: {
    id: 'D', label: 'Clarity to decisions',
    eyebrow: 'Cash and Margin Improvement for Owner-Led Companies',
    headline: 'Know your numbers.', italic: 'Run your business on them.',
    paragraph: "Most owners make real money decisions on reports that can't show where cash goes. We model how cash actually moves through your company, rank what's costing you, and turn the findings into decisions your team can carry out.",
    imagePath: '/images/heroes/clarity',
    focalPoint: { mobile: '60% 50%', desktop: 'center top' },
  },
};
export function isHeroVariant(value: unknown): value is HeroVariantId {
  return typeof value === 'string' && HERO_VARIANT_IDS.includes(value as HeroVariantId);
}

/** Widths generated for every hero photograph, in both AVIF and WebP. */
export const HERO_IMAGE_WIDTHS = [960, 1536, 2048] as const;
export const HERO_IMAGE_FORMATS = ['avif', 'webp'] as const;

/** Every file a variant needs; the build only offers a photograph when all exist. */
export function heroImageFiles(imagePath: string): string[] {
  return HERO_IMAGE_WIDTHS.flatMap(w => HERO_IMAGE_FORMATS.map(f => `${imagePath}-${w}.${f}`));
}

/** Smallest generated width that covers the rendered width at this pixel density. */
export function heroImageWidth(cssWidth: number, pixelRatio = 1): number {
  const needed = cssWidth * Math.max(1, pixelRatio);
  return HERO_IMAGE_WIDTHS.find(w => w >= needed) ?? HERO_IMAGE_WIDTHS[HERO_IMAGE_WIDTHS.length - 1];
}

/** CSS value for the hero photograph: AVIF first, WebP for browsers without AVIF. */
export function heroImageSet(imagePath: string, width: number): string {
  return `image-set(url("${imagePath}-${width}.avif") type("image/avif"), url("${imagePath}-${width}.webp") type("image/webp"))`;
}
