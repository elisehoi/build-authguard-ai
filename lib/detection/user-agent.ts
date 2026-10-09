// Reduces a user agent to browser family + OS, ignoring version numbers, so
// a browser update inside one session is not mistaken for a second device.
// Order matters: Edge and Opera also contain "Chrome", Chrome contains
// "Safari", iOS contains "Mac OS X" and Android contains "Linux".
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
]
const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/CrOS/, 'ChromeOS'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
]

const first = (agent: string, table: [RegExp, string][]) => table.find(([pattern]) => pattern.test(agent))?.[1] ?? 'other'

/** "Chrome|Windows", or null when there is no user agent to compare. */
export function clientFamily(agent: string | null): string | null {
  return agent ? `${first(agent, BROWSERS)}|${first(agent, SYSTEMS)}` : null
}
