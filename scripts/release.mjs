#!/usr/bin/env node
// `npm run push` — the whole release pipeline in one command:
//   1. typecheck
//   2. bump patch version
//   3. clean build (no stale out/release/ dirs)
//   4. package + publish a Windows installer to a GitHub Release
//   5. delete every OTHER GitHub release/tag — only the newest stays
//   6. commit + push the version bump (and any other pending changes, e.g. site/)
//   7. deploy site/ to Vercel production
//
// Requires: `gh` CLI and `vercel` CLI already logged in locally (this script does not
// handle auth — see README).

import { execSync } from 'node:child_process'
import { rmSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function run(cmd, opts = {}) {
  console.log(`\n\x1b[36m$ ${cmd}\x1b[0m`)
  return execSync(cmd, { stdio: 'inherit', cwd: root, ...opts })
}

function runCapture(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, encoding: 'utf-8', ...opts }).trim()
}

// gh/electron-builder need a *valid* token in GH_TOKEN — if a stale GITHUB_TOKEN is set
// in the environment (e.g. a revoked personal token), it takes precedence over the
// logged-in `gh` account and everything fails with 401. Always resolve a fresh one.
function githubToken() {
  const cleanEnv = { ...process.env, GITHUB_TOKEN: '', GH_TOKEN: '' }
  return execSync('gh auth token', { cwd: root, encoding: 'utf-8', env: cleanEnv }).trim()
}

console.log('=== AIOforge release pipeline ===')

// 1. Typecheck first — no point publishing a build that doesn't even compile.
run('npm run typecheck')

// 2. Bump patch version (package.json + package-lock.json), no git tag/commit yet.
const newVersion = runCapture('npm version patch --no-git-tag-version').replace(/^v/, '')
const tag = `v${newVersion}`
console.log(`\nReleasing ${tag}`)

// 3. Clean build — "no cache", every artifact this run produces is fresh.
for (const dir of ['out', 'release']) {
  rmSync(join(root, dir), { recursive: true, force: true })
}

// 4. Build + package + publish to GitHub Releases.
run('npm run build')
const token = githubToken()
run('npx electron-builder --win nsis --publish always', {
  env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token }
})

// 5. Keep only the release we just published — delete every other one (and its tag).
const cleanEnv = { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token }
const releases = JSON.parse(
  runCapture('gh release list --limit 50 --json tagName', { env: cleanEnv }) || '[]'
)
for (const r of releases) {
  if (r.tagName === tag) continue
  console.log(`Deleting old release ${r.tagName}...`)
  try {
    run(`gh release delete ${r.tagName} --yes --cleanup-tag`, { env: cleanEnv })
  } catch {
    // already gone / partially cleaned up — fine, keep going
  }
}

// 6. Commit the version bump (and anything else pending, e.g. site/ edits) and push.
run('git add -A')
try {
  run(`git commit -m "Release ${tag}"`)
  run('git push origin master')
} catch {
  console.log('Nothing to commit (version bump already matched working tree?) — continuing.')
}
run('git fetch --tags --prune --force')

// 7. Deploy the marketing site.
run('npx vercel --prod --yes', { cwd: join(root, 'site') })

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))
console.log(`
=== Done ===
Version:  ${pkg.version}
Release:  https://github.com/shaswatxd/AIOforge/releases/tag/${tag}
Download: https://github.com/shaswatxd/AIOforge/releases/latest/download/AIOforge-Setup.exe
Site:     https://aioforge.vercel.app
`)
