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
  imagePath: string;
  focalPoint: { mobile: string; desktop: string };
}
export const heroVariants: Record<HeroVariantId, HeroVariant> = {
  A: {
    id: 'A', label: 'Operations first',
    eyebrow: 'Turnaround · Restructuring · Performance Improvement',
    headline: 'Improve the operation.', italic: 'The cash and margins follow.',
    paragraph: 'Ramaekers Group works with owners and CEOs to find where cash and margin slip out of the business, then fixes it in the operations where it starts. Pricing, working capital, cost, and execution are corrected in order of dollars recovered.',
    imagePath: '/images/heroes/operations.webp',
    focalPoint: { mobile: '60% 50%', desktop: 'center top' },
  },
  B: {
    id: 'B', label: 'Principal-led',
    eyebrow: 'Hands-on Operational and Financial Leadership',
    headline: 'Senior judgment at the table.', italic: 'Hands-on execution in the business.',
    paragraph: 'Larry Ramaekers leads the engagement, bringing financial analysis and operational judgment directly to the decisions that matter. He works alongside owners, executives, and their teams to identify performance gaps and implement practical solutions, supported by specialist resources when needed.',
    imagePath: '/images/heroes/principal-led.webp',
    focalPoint: { mobile: '65% 45%', desktop: 'center top' },
  },
  C: {
    id: 'C', label: 'Under pressure',
    eyebrow: 'Turnaround and Interim Management',
    headline: 'When cash gets tight,', italic: 'every week counts.',
    paragraph: 'Losses, a lender losing patience, a major customer gone. Ramaekers Group steps in to take control of cash, stabilize the operation, and restore margin—as an advisor or as interim leadership. We act before your options start to narrow.',
    imagePath: '/images/heroes/under-pressure.webp',
    focalPoint: { mobile: '60% 50%', desktop: 'center bottom' },
  },
  D: {
    id: 'D', label: 'Clarity to decisions',
    eyebrow: 'Cash and Margin Improvement for Owner-Led Companies',
    headline: 'Know your numbers.', italic: 'Run your business on them.',
    paragraph: "Most owners make real money decisions on reports that can't show where cash goes. We model how cash actually moves through your company, rank what's costing you, and turn the findings into decisions your team can carry out.",
    imagePath: '/images/heroes/clarity.webp',
    focalPoint: { mobile: '60% 50%', desktop: 'center top' },
  },
};
export function isHeroVariant(value: unknown): value is HeroVariantId {
  return typeof value === 'string' && HERO_VARIANT_IDS.includes(value as HeroVariantId);
}
