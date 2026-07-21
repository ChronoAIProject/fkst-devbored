import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const fail = (message) => {
  throw new Error(message);
};
const gitBlobHash = (bytes) => createHash('sha1')
  .update(`blob ${bytes.length}\0`)
  .update(bytes)
  .digest('hex');

const map = readJson('docs/spec/evidence/governance/accelerated-package-map.v1.json');
const contract = readJson('docs/spec/evidence/governance/execution-contract.v2.json');
const packageTemplate = readJson('docs/spec/evidence/governance/package-state-template.v2.json');
const gateTemplate = readJson('docs/spec/evidence/governance/human-gate-template.v1.json');
const cutover = readJson('docs/spec/evidence/governance/R3-accelerated-delivery-cutover.json');
const registryText = readFileSync(resolve(root, map.requirement_registry), 'utf8');

const requirementPattern = '(?:G|R|U|C|D|A|L|B|P|W|F|I|E|X)-\\d{3}';
const registryRows = [...registryText.matchAll(new RegExp(`^\\| (${requirementPattern}) \\| ([^|]*) \\|`, 'gm'))]
  .map((match) => ({
    id: match[1],
    dependencies: [...match[2].matchAll(new RegExp(`${requirementPattern}|HG-\\d{2}`, 'g'))]
      .map((dependency) => dependency[0])
  }));
const registryIds = registryRows.map((row) => row.id);
const registrySet = new Set(registryIds);
if (registryIds.length !== registrySet.size) {
  const seen = new Set();
  const duplicates = registryIds.filter((id) => seen.has(id) || !seen.add(id));
  fail(`requirement registry contains duplicate rows: ${[...new Set(duplicates)].join(', ')}`);
}
if (registryIds.length !== map.requirement_count) {
  fail(`requirement registry count ${registryIds.length} != declared ${map.requirement_count}`);
}

if (map.packages.length !== map.package_count) {
  fail(`package count ${map.packages.length} != declared ${map.package_count}`);
}
const packageIds = new Set();
const requirementOwners = new Map();
const pathOwners = new Map();
const pathScopes = [];
for (const pkg of map.packages) {
  if (packageIds.has(pkg.id)) fail(`duplicate package id ${pkg.id}`);
  packageIds.add(pkg.id);
  if (!Array.isArray(pkg.requirements) || pkg.requirements.length === 0) {
    fail(`${pkg.id} has no requirement ownership`);
  }
  if (!Array.isArray(pkg.exclusive_paths) || pkg.exclusive_paths.length === 0) {
    fail(`${pkg.id} has no exclusive paths`);
  }
  for (const requirement of pkg.requirements) {
    if (!registrySet.has(requirement)) fail(`${pkg.id} owns unknown requirement ${requirement}`);
    if (requirementOwners.has(requirement)) {
      fail(`${requirement} has duplicate owners ${requirementOwners.get(requirement)} and ${pkg.id}`);
    }
    requirementOwners.set(requirement, pkg.id);
  }
  for (const path of pkg.exclusive_paths) {
    if (path.includes('..')) fail(`${pkg.id} uses escaping exclusive path ${path}`);
    if (pathOwners.has(path)) fail(`exclusive path ${path} is owned by ${pathOwners.get(path)} and ${pkg.id}`);
    pathOwners.set(path, pkg.id);
    pathScopes.push({ packageId: pkg.id, path });
  }
}

const normalizeScope = (path) => {
  const qualified = path.match(/^(packages|substrate|fkst-devbored):(.*)$/);
  if (path.includes(':') && !qualified) fail(`unknown exclusive-path repository qualifier: ${path}`);
  const repository = qualified?.[1] ?? 'fkst-devbored';
  const pattern = (qualified?.[2] ?? path).replace(/^\.\//, '');
  const wildcard = pattern.search(/[?*\[]/);
  const prefix = wildcard === -1 ? pattern : pattern.slice(0, wildcard);
  return { repository, prefix };
};
const scopesMayOverlap = (left, right) => {
  const a = normalizeScope(left);
  const b = normalizeScope(right);
  return a.repository === b.repository
    && (a.prefix.startsWith(b.prefix) || b.prefix.startsWith(a.prefix));
};
const pathScopeOverlaps = [];
for (let leftIndex = 0; leftIndex < pathScopes.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < pathScopes.length; rightIndex += 1) {
    const left = pathScopes[leftIndex];
    const right = pathScopes[rightIndex];
    if (left.packageId !== right.packageId && scopesMayOverlap(left.path, right.path)) {
      pathScopeOverlaps.push(`${left.packageId}:${left.path} <> ${right.packageId}:${right.path}`);
    }
  }
}
if (pathScopeOverlaps.length) {
  fail(`exclusive path scopes may overlap: ${pathScopeOverlaps.join('; ')}`);
}

const missing = registryIds.filter((id) => !requirementOwners.has(id));
if (missing.length) fail(`unowned requirements: ${missing.join(', ')}`);
if (requirementOwners.size !== registryIds.length) {
  fail(`owned requirement count ${requirementOwners.size} != registry count ${registryIds.length}`);
}
if (map.coverage_claim.missing_requirement_count !== 0 || map.coverage_claim.duplicate_primary_owner_count !== 0) {
  fail('coverage claim is not fail-closed');
}

const gateIds = new Set(map.human_gates.map((gate) => gate.id));
if (gateIds.size !== map.human_gates.length) fail('duplicate human gate id');
const graphIds = new Set([...packageIds, ...gateIds]);
const dependencies = new Map();
for (const node of [...map.packages, ...map.human_gates]) {
  for (const dependency of node.depends_on) {
    if (!graphIds.has(dependency)) fail(`${node.id} depends on unknown node ${dependency}`);
    if (dependency === node.id) fail(`${node.id} depends on itself`);
  }
  dependencies.set(node.id, [...node.depends_on]);
}

const roots = [...dependencies].filter(([, deps]) => deps.length === 0).map(([id]) => id);
if (roots.length !== 1 || roots[0] !== 'AP-00') {
  fail(`expected one AP-00 root, got ${roots.join(', ')}`);
}
const visiting = new Set();
const visited = new Set();
const visit = (id, stack = []) => {
  if (visiting.has(id)) fail(`cycle detected: ${[...stack, id].join(' -> ')}`);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dependency of dependencies.get(id)) visit(dependency, [...stack, id]);
  visiting.delete(id);
  visited.add(id);
};
for (const id of graphIds) visit(id);
if (visited.size !== graphIds.size) fail('graph contains unreachable nodes');

const transitiveDependencies = (id, seen = new Set()) => {
  for (const dependency of dependencies.get(id) ?? []) {
    if (!seen.has(dependency)) {
      seen.add(dependency);
      transitiveDependencies(dependency, seen);
    }
  }
  return seen;
};
const dependencyViolations = [];
for (const row of registryRows) {
  const owner = requirementOwners.get(row.id);
  const ancestors = transitiveDependencies(owner);
  for (const dependency of row.dependencies) {
    const dependencyOwner = requirementOwners.get(dependency) ?? dependency;
    if (!graphIds.has(dependencyOwner)) {
      dependencyViolations.push(`${row.id} names unknown dependency ${dependency}`);
    } else if (dependencyOwner !== owner && !ancestors.has(dependencyOwner)) {
      dependencyViolations.push(`${row.id}/${owner} does not preserve ${dependency}/${dependencyOwner}`);
    }
  }
}
if (dependencyViolations.length) {
  fail(`registry dependencies are not preserved transitively: ${dependencyViolations.join('; ')}`);
}

const fullCompletion = map.completion_sets?.full_product_and_unrescoped_submission;
if (!Array.isArray(fullCompletion)) fail('full-product completion set is missing');
if (new Set(fullCompletion).size !== fullCompletion.length) fail('full-product completion set contains duplicate nodes');
const missingCompletionNodes = [...graphIds].filter((id) => !fullCompletion.includes(id));
const unknownCompletionNodes = fullCompletion.filter((id) => !graphIds.has(id));
if (missingCompletionNodes.length || unknownCompletionNodes.length) {
  fail(`full-product completion set mismatch; missing=${missingCompletionNodes.join(',')} unknown=${unknownCompletionNodes.join(',')}`);
}
if (map.deadline_submission_slice?.status !== 'PROPOSED_REQUIRES_HUMAN_RESCOPE'
  || map.deadline_submission_slice?.authorization !== false) {
  fail('deadline submission slice must remain an unauthorized human-RESCOPE proposal');
}

const exactArray = (actual, expected, name) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${name} must equal ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};
exactArray(map.primary_dependencies, ['fkst-substrate', 'public-devloop'], 'primary_dependencies');
exactArray(map.app_authority, ['Workflow', 'Council'], 'app_authority');
exactArray(map.reference_only, ['devbored', 'github-devloop*', 'consensus', 'github-proxy'], 'reference_only');
if (requirementOwners.get('R-059') !== 'AP-02') fail('R-059 must remain a contract-harness requirement in AP-02');

const packageStates = new Set(contract.package_states);
for (const [from, targets] of Object.entries(contract.normal_transitions)) {
  if (!packageStates.has(from)) fail(`unknown transition source ${from}`);
  for (const target of targets) if (!packageStates.has(target)) fail(`unknown transition target ${target}`);
}
if (Object.keys(contract.normal_transitions).length !== packageStates.size) {
  fail('package transition table does not close every package state');
}
if (!packageStates.has(packageTemplate.state)) fail(`template state ${packageTemplate.state} is not closed`);
if (packageTemplate.schema !== 'fkst.package-state/v2') fail('wrong package template schema');
if (Object.hasOwn(packageTemplate, 'pm_decisions')) fail('v2 package template must not contain per-package PM decisions');

const milestoneStates = new Set(contract.milestone_states);
for (const [from, targets] of Object.entries(contract.milestone_transitions ?? {})) {
  if (!milestoneStates.has(from)) fail(`unknown milestone transition source ${from}`);
  for (const target of targets) {
    if (!milestoneStates.has(target)) fail(`unknown milestone transition target ${target}`);
  }
}
if (Object.keys(contract.milestone_transitions ?? {}).length !== milestoneStates.size) {
  fail('milestone transition table does not close every milestone state');
}

const decisions = new Set(contract.human_decisions);
for (const gate of map.human_gates) {
  for (const decision of gate.decisions) {
    if (!decisions.has(decision)) fail(`${gate.id} uses unknown decision ${decision}`);
  }
}
if (gateTemplate.schema !== 'fkst.human-gate/v1') fail('wrong human gate template schema');
if (gateTemplate.decision !== null) fail('unapproved human gate template must have a null decision');
if (gateTemplate.milestone_state !== 'HUMAN_REVIEW') fail('human gate template must begin in HUMAN_REVIEW');
if (gateTemplate.fail_closed_until_approved !== true) fail('human gate template must fail closed');
if (!Array.isArray(gateTemplate.required_v1_artifacts)) fail('required_v1_artifacts receipt field must be an array');
for (const gate of map.human_gates) {
  const requiredFields = contract.human_gate_required_fields?.[gate.id];
  if (!Array.isArray(requiredFields) || requiredFields.length === 0) {
    fail(`${gate.id} has no required receipt-field contract`);
  }
  for (const field of requiredFields) {
    if (!Object.hasOwn(gateTemplate, field)) fail(`${gate.id} requires absent receipt field ${field}`);
  }
}
if (Object.keys(contract.human_gate_required_fields ?? {}).length !== gateIds.size) {
  fail('human gate receipt-field rules do not exactly cover the gate map');
}
const fixtureGate = map.human_gates.find((gate) => gate.id === 'HG-01');
if (JSON.stringify(fixtureGate?.required_v1_artifacts) !== JSON.stringify(['R-041', 'R-051'])) {
  fail('HG-01 must require exact accepted R-041 and R-051 v1 artifacts');
}
if (decisions.has('AMBIGUOUS_APPROVAL')) fail('ambiguous approval unexpectedly accepted');
if (packageStates.has('PM_ACCEPTED')) fail('per-package PM acceptance unexpectedly accepted');

for (const [path, expected] of Object.entries(cutover.historical_hash_guard)) {
  const bytes = readFileSync(resolve(root, path));
  const actual = gitBlobHash(bytes);
  if (actual !== expected) fail(`historical hash changed for ${path}: ${actual} != ${expected}`);
}

const openV1Records = cutover.open_v1_records_at_cutover?.records ?? {};
const appendOnlyArrays = ['transition_history', 'submissions', 'advisories', 'reviews', 'pm_decisions'];
const mutableOpenFields = new Set(['state', 'review_cycle', ...appendOnlyArrays, 'integration']);
for (const [taskId, record] of Object.entries(openV1Records)) {
  const baselineBytes = execFileSync(
    'git',
    ['show', `${cutover.pre_mutation_head}:${record.path}`],
    { cwd: root, maxBuffer: 10 * 1024 * 1024 }
  );
  if (gitBlobHash(baselineBytes) !== record.cutover_blob) {
    fail(`${taskId} cutover baseline does not match ${cutover.pre_mutation_head}`);
  }
  const currentBytes = readFileSync(resolve(root, record.path));
  if (gitBlobHash(currentBytes) !== record.current_blob) {
    fail(`${taskId} current open-v1 blob lacks a documented re-baseline`);
  }
  const baseline = JSON.parse(baselineBytes.toString('utf8'));
  const current = JSON.parse(currentBytes.toString('utf8'));
  if (baseline.task_id !== taskId || current.task_id !== taskId) fail(`${taskId} identity changed`);
  for (const key of new Set([...Object.keys(baseline), ...Object.keys(current)])) {
    if (!mutableOpenFields.has(key)
      && JSON.stringify(baseline[key]) !== JSON.stringify(current[key])) {
      fail(`${taskId} changed immutable v1 field ${key}`);
    }
  }
  for (const key of appendOnlyArrays) {
    const before = baseline[key] ?? [];
    const after = current[key] ?? [];
    if (!Array.isArray(before) || !Array.isArray(after)
      || JSON.stringify(after.slice(0, before.length)) !== JSON.stringify(before)) {
      fail(`${taskId} did not append to v1 field ${key}`);
    }
  }
  if (current.review_cycle < baseline.review_cycle) fail(`${taskId} review cycle regressed`);
  if (current.state !== record.current_state
    || current.transition_history.at(-1) !== current.state) {
    fail(`${taskId} current state is not bound to its transition history`);
  }
  if (current.state === 'INTEGRATED' && (!current.integration || !record.closure_receipt)) {
    fail(`${taskId} integrated without both task and cutover closure receipts`);
  }
}
if (JSON.stringify(Object.keys(openV1Records).sort()) !== JSON.stringify(['R-041', 'R-051'])) {
  fail('open v1 cutover records must be exactly R-041 and R-051');
}

const markdownUnder = (directory) => readdirSync(resolve(root, directory), { withFileTypes: true })
  .flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return markdownUnder(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  });
const markdownAuthority = [...new Set([
  'README.md',
  'docs/08-DECISIONS.md',
  ...markdownUnder('docs/spec'),
  ...markdownUnder('plans')
])].sort();
for (const path of markdownAuthority) {
  const absolute = resolve(root, path);
  const markdown = readFileSync(absolute, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    target = target.split('#', 1)[0];
    if (!target) continue;
    const resolvedTarget = resolve(dirname(absolute), target);
    if (resolvedTarget !== root && !resolvedTarget.startsWith(`${root}/`)) {
      fail(`non-hermetic Markdown link escapes repository in ${path}: ${match[1]}`);
    }
    if (!existsSync(resolvedTarget)) {
      fail(`broken local Markdown link in ${path}: ${match[1]}`);
    }
  }
}

console.log('ACCELERATED_PLAN_VERIFY=PASS');
console.log(`requirements=${registryIds.length} packages=${map.packages.length} gates=${map.human_gates.length} graph_nodes=${graphIds.size}`);
console.log(`graph_root=${roots[0]} missing=${missing.length} duplicate_owners=${requirementOwners.size - registryIds.length} cycles=${graphIds.size - visited.size} path_scope_overlaps=${pathScopeOverlaps.length}`);
console.log(`requirement_edges_preserved=PASS full_product_completion=${fullCompletion.length}/${graphIds.size} deadline_slice_authorized=${map.deadline_submission_slice.authorization}`);
console.log('primary_dependencies=fkst-substrate,public-devloop');
console.log('app_authority=Workflow,Council reference_only=devbored,github-devloop*,consensus,github-proxy');
console.log('R-059=AP-02_contract_harness_outside_RUN_family');
console.log('negative_state=PASS negative_human_decision=PASS pending_gate_schema_fail_closed=PASS');
console.log('milestone_transitions=PASS gate_receipt_fields=PASS');
console.log(`historical_hashes=${Object.keys(cutover.historical_hash_guard).length} open_v1_records=${Object.keys(openV1Records).length} markdown_authority_files=${markdownAuthority.length} markdown_links=PASS`);
