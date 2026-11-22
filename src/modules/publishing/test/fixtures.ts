import type { PackageGroup, PublishPackage } from '../api/publishing-api';

// Test data only: plain placeholders for the shape the API returns.
export function makePackage(overrides: Partial<PublishPackage> = {}): PublishPackage {
  return {
    id: 1,
    title: 'Package A',
    intro: 'Intro',
    badge: null,
    price: 5000,
    priceNote: null,
    durationText: '12 months',
    authorBox: { title: 'Author box', text: 'Author text' },
    ctaText: 'Request now',
    order: 1,
    features: ['Editing', 'Cover'],
    conditions: ['Condition one'],
    steps: [
      { title: 'Step one', description: 'Description' },
      { title: 'Step two', description: null },
    ],
    ...overrides,
  };
}

export function makeGroups(): PackageGroup[] {
  return [
    {
      section: { id: 1, name: 'One year', durationMonths: 12, order: 1 },
      packages: [
        makePackage(),
        makePackage({
          id: 2,
          title: 'Package B',
          badge: 'Most requested',
          price: null,
          priceNote: 'Depends on project',
        }),
      ],
    },
    {
      section: { id: 2, name: 'Three years', durationMonths: 36, order: 2 },
      packages: [makePackage({ id: 3, title: 'Package C' })],
    },
  ];
}
