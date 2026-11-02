// Publish only the static build to gh-pages. The source checkout stays intact.
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const project = resolve(import.meta.dirname, '..');
function run(args, cwd = project, allowed = [0]) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', env: process.env });
  if (!allowed.includes(result.status)) throw new Error(result.stderr.trim() || `Git command failed (${result.status}).`);
  return result;
}
const remote = run(['remote', 'get-url', 'origin']).stdout.trim();
if (remote !== 'https://github.com/denniskurian65-sudo/LEARN.git') {
  throw new Error('Check the deployment destination. Expected the LEARN GitHub repository.');
}
const build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: project, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);

const publishedRef = run(['ls-remote', '--heads', 'origin', 'gh-pages']).stdout.trim();
const authorName = run(['config', 'user.name']).stdout.trim();
const authorEmail = run(['config', 'user.email']).stdout.trim();
const staging = await mkdtemp(join(tmpdir(), 'fieldnotes-pages-'));
try {
  run(['init', '--initial-branch=gh-pages'], staging);
  run(['remote', 'add', 'origin', remote], staging);
  if (publishedRef) {
    run(['fetch', '--depth=1', 'origin', 'gh-pages'], staging);
    run(['checkout', '-B', 'gh-pages', 'FETCH_HEAD'], staging);
  }
  // This directory was created by this script. Never clean the source checkout.
  for (const entry of await readdir(staging)) {
    if (entry !== '.git') await rm(join(staging, entry), { force: true, recursive: true });
  }
  await cp(join(project, 'dist'), staging, { recursive: true });
  run(['add', '--all'], staging);
  const changed = run(['diff', '--cached', '--quiet'], staging, [0, 1]).status !== 0;
  if (changed) {
    run(['-c', `user.name=${authorName}`, '-c', `user.email=${authorEmail}`, 'commit', '-m', 'Publish Fieldnotes learning website'], staging);
  }
  run(['push', 'origin', 'HEAD:refs/heads/gh-pages'], staging);
  console.log('Uploaded static files to the gh-pages branch.');
  console.log('GitHub Pages must be enabled for that branch before the website is live.');
} finally {
  await rm(staging, { recursive: true, force: true });
}
