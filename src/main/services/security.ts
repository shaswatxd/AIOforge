import { createHash } from 'crypto'

/** SHA256 helpers used to fingerprint/verify SetupForge's own export & backup files
 *  (tamper/corruption detection on restore). Installer binaries themselves are verified by
 *  winget/choco via Authenticode signature checks before they ever run — SetupForge doesn't
 *  re-implement that, it only ever invokes the trusted package manager CLIs. */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex')
}

export function assertHttps(url: string): void {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:') {
    throw new Error(`Refusing non-HTTPS URL: ${url}`)
  }
}
