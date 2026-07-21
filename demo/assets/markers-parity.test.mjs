import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

import {
  compareStateMarkers,
  compareTransitionVersions
} from './markers.js';

const corpusUrl = new URL('../fixtures/contract/transition-version-parity.v1.json', import.meta.url);
const corpus = JSON.parse(await readFile(corpusUrl, 'utf8'));

assert.equal(corpus.schema, 'fkst.demo.transition-version-parity.v1');

let assertions = 0;
for (const comparison of corpus.comparisons) {
  assert.equal(
    compareTransitionVersions(comparison.left, comparison.right),
    comparison.expectedSign,
    comparison.name
  );
  assert.equal(
    compareTransitionVersions(comparison.right, comparison.left),
    comparison.expectedSign === 0 ? 0 : -comparison.expectedSign,
    `${comparison.name} (reverse)`
  );
  assertions += 2;
}

for (const comparison of corpus.stateMarkerComparisons) {
  assert.equal(
    compareStateMarkers(comparison.left, comparison.right),
    comparison.expectedSign,
    comparison.name
  );
  assertions += 1;
}

console.log(`transition-version parity: ${assertions}/${assertions} assertions passed (${corpus.comparisons.length} engine cases + stage-rank counterexample)`);
