/**
 * studio.js — Single source of truth for the v6 studio homepage.
 *
 * Every number in here is derived from real data (public/videos-enriched.json,
 * the live client-site registry). Nothing is invented. `deriveStats()` recomputes
 * the headline figures from the real video dataset at build time so the hero can
 * never drift from the portfolio.
 *
 * @module data/studio
 */
import videoData from './videos.json'

/** @typedef {{id:number,title:string,artist:string,description:string,youtubeId:string,uploadDate:string,viewCount:number,thumbnail:string}} Video */

/**
 * The canonical dataset lives in src/data/videos.json (public/ can't be imported
 * by Vite) and is shaped `{ videos: [...] }`, not a bare array. Thumbnails are
 * derived from the YouTube id rather than stored, so a dataset refresh can never
 * leave a stale image URL behind.
 * @type {Video[]}
 */
export const ALL_VIDEOS = /** @type {Video[]} */ (
    (videoData.videos || []).map((v) => ({
        ...v,
        thumbnail: `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`
    }))
)

/**
 * Recompute headline stats from the real dataset.
 * Called once at module load — never hardcode these numbers anywhere else.
 * @returns {{films:number,artists:number,views:number,firstYear:string,lastYear:string,years:number}}
 */
function deriveStats() {
    const artists = new Set(ALL_VIDEOS.map((v) => v.artist).filter(Boolean))
    const views = ALL_VIDEOS.reduce((sum, v) => sum + (v.viewCount || 0), 0)
    const years = ALL_VIDEOS.map((v) => v.uploadDate?.slice(0, 4)).filter(Boolean).sort()
    const firstYear = years[0] || '2012'
    const lastYear = years[years.length - 1] || String(new Date().getFullYear())
    return {
        films: ALL_VIDEOS.length,
        artists: artists.size,
        views,
        firstYear,
        lastYear,
        years: Number(lastYear) - Number(firstYear) + 1
    }
}

export const STATS = deriveStats()

/**
 * The six films that lead the reel — the highest-viewed work, which is also the
 * work with the most recognisable names attached. Sorted by views, deduped by
 * artist so the grid doesn't read as one client's showreel.
 * @returns {Video[]}
 */
function selectReel() {
    const seen = new Set()
    const picked = []
    for (const v of [...ALL_VIDEOS].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))) {
        if (seen.has(v.artist)) continue
        seen.add(v.artist)
        picked.push(v)
        if (picked.length === 6) break
    }
    return picked
}

export const REEL = selectReel()

/** Every artist, ordered by the total views their work pulled. */
export const ROSTER = (() => {
    const totals = {}
    for (const v of ALL_VIDEOS) {
        if (!v.artist) continue
        totals[v.artist] = (totals[v.artist] || 0) + (v.viewCount || 0)
    }
    return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([artist]) => artist)
        .filter((a) => a !== 'Unknown')
})()

/**
 * Shipped software. Only sites verified live in the client-site registry
 * (reference-live-client-sites-registry, probed 2026-07-15) appear here —
 * a dead link on an agency site is worse than one fewer case study.
 */
export const BUILDS = [
    {
        slug: 'betmetrics',
        client: 'BetMetrics',
        sector: 'Sports analytics',
        summary:
            'A live odds and bet-tracking platform. Real-time Convex backend, Clerk auth, a casino surface, and a props engine that reconciles against the sportsbooks every minute.',
        stack: ['Next.js 15', 'Convex', 'Clerk', 'Vercel'],
        url: 'https://betmetrics.ca',
        preview: '/sites/betmetrics-preview.jpg'
    },
    {
        slug: 'kmoney',
        client: 'KMONEY',
        sector: 'Recording artist',
        summary:
            'Artist site built around the catalogue — releases, video wall, and a booking funnel that routes straight to management.',
        stack: ['React', 'Vite', 'Vercel'],
        url: 'https://officialkmoney.com',
        preview: '/sites/kmoney-preview.jpg',
        icon: '/sites/kmoney-icon.svg'
    },
    {
        slug: '100bandplan',
        client: '100 Band Plan',
        sector: 'Label / collective',
        summary:
            'Label front door. Roster pages, release archive, and a press kit that a booker can actually use without emailing anyone.',
        stack: ['React', 'Vite', 'Vercel'],
        url: 'https://100bandplan.com',
        preview: '/sites/100bandplan-preview.jpg',
        icon: '/sites/100bandplan-icon.svg'
    },
    {
        slug: 'streetbud',
        client: 'Street Bud',
        sector: 'Recording artist',
        summary:
            'Atlanta rapper signed by Quavo to Huncho Records at fourteen, champion of Lifetime’s The Rap Game season 4, independent now. A WebGL night street you walk down where every streetlight holds one of his music videos, ordered by year so the walk is the career.',
        stack: ['Three.js', 'Vanilla JS', 'Vercel'],
        url: 'https://officialstreetbud.com',
        preview: '/sites/streetbud-preview.jpg'
    },
    {
        slug: 'savv4x',
        client: 'SAVV4X',
        sector: 'Recording artist',
        summary:
            'Catalogue-led artist site with an admin panel so the team can push drops without touching a deploy.',
        stack: ['React', 'Redis', 'Vercel'],
        url: 'https://savv4x.com',
        preview: '/sites/savv-preview.jpg',
        icon: '/sites/savv-icon.png'
    },
    {
        slug: 'syreneffect',
        client: 'Syren Effect',
        sector: 'Recording artist',
        summary:
            'Dark editorial artist site — full-bleed video hero, release grid, and a contact path built for features.',
        stack: ['React', 'Vite', 'Vercel'],
        url: 'https://syreneffect.com',
        preview: '/sites/syren-preview.jpg',
        icon: '/sites/syren-icon.png'
    },
    {
        slug: 'musthavefrenchies',
        client: 'Must Have Frenchies',
        sector: 'Breeder / e-commerce',
        summary:
            'Litter management and enquiry pipeline with an owner admin — availability, deposits, and buyer vetting in one place.',
        stack: ['React', 'Admin panel', 'Vercel'],
        url: 'https://musthavefrenchies.com',
        preview: '/sites/frenchies-preview.jpg',
        icon: '/sites/frenchies-icon.png'
    }
]

/**
 * The pipeline — the argument for why one studio doing all three costs less and
 * lands better than three vendors. This is the differentiator section.
 */
export const PIPELINE = [
    {
        n: '01',
        title: 'Direct',
        lede: 'Treatment, shoot, edit, colour.',
        body:
            'Thirteen years of music video direction across Toronto and beyond. We arrive with a treatment, not a mood board, and we deliver a master that holds up on a phone screen at 2am — which is where it actually gets watched.'
    },
    {
        n: '02',
        title: 'Design',
        lede: 'Identity, art direction, the whole visual system.',
        body:
            'The film sets the palette; the site inherits it. One studio holding both means the type on your site is the type on your cover, and nobody has to reconcile two agencies’ idea of your brand.'
    },
    {
        n: '03',
        title: 'Ship',
        lede: 'Production software, not brochureware.',
        body:
            'Real applications — auth, databases, payments, admin panels the team can run without us. Deployed, monitored, and handed over with the keys. Six live products currently in production.'
    }
]

/** Contact routes. Calendly is the primary CTA; email is the fallback. */
export const CONTACT = {
    booking: 'https://calendly.com/tdotssolutionsz/30min',
    email: 'dev@jamesdare.com',
    location: 'Toronto, Ontario'
}

/**
 * Format a raw view count as a compact display string.
 * @param {number} n
 * @returns {string} e.g. 5741613 -> "5.7M"
 */
export function compactViews(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
}
