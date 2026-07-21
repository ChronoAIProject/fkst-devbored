#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = resolve(toolsDirectory, '../fixtures/contract');
const validatorUrl = new URL('../assets/validator.js', import.meta.url);
const files = {
  contract: resolve(fixtureDirectory, 'council-v1.contract.json'),
  fixtures: resolve(fixtureDirectory, 'council-v1.fixtures.json'),
  corpus: resolve(fixtureDirectory, 'council-corpus-v1.json'),
};

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function printBucket(label, bucket) {
  const status = bucket.failed === 0 ? 'PASS' : 'FAIL';
  console.log(`${label.padEnd(17)} ${status}  ${bucket.passed}/${bucket.total} passed, ${bucket.failed} failed`);
  for (const testCase of bucket.cases.filter((candidate) => !candidate.passed)) {
    console.log(`  - ${testCase.id}`);
    console.log(`    expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`    actual:   ${JSON.stringify(testCase.actual)}`);
  }
}

try {
  // This repository has no package-level module declaration. Node 22+ can
  // detect the ESM syntax in validator.js; suppress only its typeless warning.
  process.removeAllListeners('warning');
  const { loadContract, runFixtures } = await import(validatorUrl);
  const [contractJson, fixturesJson, corpusJson] = await Promise.all([
    readJson(files.contract),
    readJson(files.fixtures),
    readJson(files.corpus),
  ]);
  const results = runFixtures(loadContract(contractJson), fixturesJson, corpusJson);

  console.log('Council fixture case self-check');
  printBucket('declarative', results.declarative);
  printBucket('definitionCases', results.definitionCases);
  printBucket('roundCases', results.roundCases);
  console.log('NOT VALIDATED: digest/canonicalization parity (R-010).');
  console.log('NOT VALIDATED: lineage and activation-cap enforcement (C-10).');
  console.log('NOT VALIDATED: runtime invocation, timeout, replay, and normalization mechanics (C-07).');

  const failed = Object.values(results).reduce((total, bucket) => total + bucket.failed, 0);
  console.log(failed === 0 ? 'PASS' : `FAIL (${failed} unexpected mismatch${failed === 1 ? '' : 'es'})`);
  if (failed > 0) process.exitCode = 1;
} catch (error) {
  console.error('Council fixture case self-check could not run.');
  console.error(error instanceof Error ? error.message : String(error));
  console.error(`Expected fixture files under ${fixtureDirectory}`);
  process.exitCode = 1;
}
