import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexPage = readFileSync('src/pages/design-system/index.astro', 'utf8');
const typographyPage = readFileSync('src/pages/design-system/typography/index.astro', 'utf8');

test('design system headings updated to Title Case on index page', () => {
  const expectedPairs = [
    ['A palette with purpose.', 'A Palette with Purpose.'],
    ['Primary palette', 'Primary Palette'],
    ['Supporting palette', 'Supporting Palette'],
    ['Clear thinking. Clearly expressed.', 'Clear Thinking. Clearly Expressed.'],
    ['Four surfaces. One system.', 'Four Surfaces. One System.'],
    ['Consistent by design.', 'Consistent by Design.'],
    ['Make the next step clear.', 'Make the Next Step Clear.'],
    ['Field states', 'Field States'],
    ['Try validation', 'Try Validation'],
    ['Room for the important things.', 'Room for the Important Things.'],
    ['Spacing scale', 'Spacing Scale'],
    ['Corner radii', 'Corner Radii'],
    ['Built to work at every scale.', 'Built to Work at Every Scale.'],
    ['Clarity starts with visibility.', 'Clarity Starts with Visibility.'],
    ['Bring the details into focus.', 'Bring the Details into Focus.'],
    ['Strategy with financial purpose.', 'Strategy with Financial Purpose.'],
    ['Discipline drives execution.', 'Discipline Drives Execution.'],
  ] as const;

  for (const [before, after] of expectedPairs) {
    assert.equal(indexPage.includes(after), true, `missing updated heading: ${after}`);
    assert.equal(indexPage.includes(before), false, `found old heading: ${before}`);
  }
});

test('design system headings updated to Title Case on typography page', () => {
  const expectedPairs = [
    ['Choose a pairing.', 'Choose a Pairing.'],
    ['Live specimens', 'Live Specimens'],
  ] as const;

  for (const [before, after] of expectedPairs) {
    assert.equal(typographyPage.includes(after), true, `missing updated heading: ${after}`);
    assert.equal(typographyPage.includes(before), false, `found old heading: ${before}`);
  }
});
