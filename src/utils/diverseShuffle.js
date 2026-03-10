/**
 * diverseShuffle — sliding-window random selection that avoids recent repeats.
 *
 * Used by both VideoSpotlight (hub hero) and useShufflePlay (video page queue)
 * to ensure content diversity without repeating recently-shown items.
 *
 * @param {Array} pool       - Items to pick from (must be non-empty)
 * @param {Array} history    - Mutable array of recently-used keys (updated in place)
 * @param {number} maxHistory - Maximum history length before oldest entry is evicted
 * @param {(item: any) => string} keyFn - Extracts the identity key from a pool item
 * @returns {number} Index into `pool` of the selected item
 */
export function diverseShuffle(pool, history, maxHistory, keyFn) {
  // Trim history to maxHistory BEFORE filtering — prevents over-exclusion
  // when maxHistory shrinks between calls (e.g. historySize prop change)
  while (history.length > maxHistory) history.shift()

  const historySet = new Set(history)
  const candidates = pool
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => !historySet.has(keyFn(item)))

  let source
  if (candidates.length > 0) {
    source = candidates
  } else {
    // Fallback: history covers entire pool. Exclude the most recent entry
    // to prevent back-to-back repeats (user hits "NEXT" → same video).
    const lastKey = history.length > 0 ? history[history.length - 1] : null
    source = pool
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => keyFn(item) !== lastKey)
    // If pool has only 1 item, no exclusion is possible — use full pool
    if (source.length === 0) {
      source = pool.map((item, i) => ({ item, i }))
    }
  }

  const picked = source[Math.floor(Math.random() * source.length)]
  history.push(keyFn(pool[picked.i]))
  while (history.length > maxHistory) history.shift()

  return picked.i
}
