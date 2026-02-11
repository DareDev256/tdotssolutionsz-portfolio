/**
 * SVG-based fallback for broken video/photo thumbnails.
 * Encoded as a data URI so it works offline and never triggers its own load error.
 * @module imageFallback
 */

/** 320×180 (16:9) dark placeholder with a play triangle and "No Preview" text */
export const THUMBNAIL_FALLBACK = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">` +
    `<rect width="320" height="180" fill="#0a0a1a"/>` +
    `<polygon points="148,72 148,108 176,90" fill="#ff6ec7" opacity="0.5"/>` +
    `<text x="160" y="130" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="12">No Preview</text>` +
    `</svg>`
)}`
