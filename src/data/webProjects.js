/**
 * The web-design floor's site cards (moved out of HubPageCinema.jsx in 6.19.0, unchanged, so the
 * build can read the same list: vite.config.js renders the no-JS copy in index.html from it).
 */
/**
 * Scene 3 browser cards.
 *
 * `layout` lives on the entry rather than in positional arrays indexed by `i`.
 * The previous form was `width: [400, 360][i]` etc., which silently produced
 * `undefined` width/top/left for any third project — adding one rendered an
 * unpositioned card. Keeping placement with the data means a new site can be
 * appended without touching the render.
 */
/* Every site card plays a scroll-through of its own site (2026-10-21): an 8.4 s
   muted loop recorded from the live domain at a 1280x800 desktop, poster = its
   first frame. Rebuild with `node scripts/build-site-clips.mjs [--only=<slug>]`. */
const scrollThrough = (slug) => ({ clip: `/sites/clips/${slug}.mp4`, poster: `/sites/clips/${slug}.jpg` })

export const WEB_PROJECTS = [
  /* newest first. Desktop places every entry by its `layout`; phones (<=768px)
     show all of them in two drifting rails (see Rail below), so nothing is cut. Every entry is a site James
     shipped that answers 200 on its own domain (probed 2026-09-20).
     edsonlegal.com is the firm's own site, not ours, and stays out.
     Layouts keep the middle third clear for the title and the tower shaft. */
  /* Bodies In Boxes, the Savv4x promo game (2026-10-15), keeps its PLAY tag and
     red hairline: its `clip` is a gameplay loop framed the way savv4x.com/play
     looks on a desktop. Clips play only while this floor is on screen and the
     card is in view (setClipsPlaying). */
  { name: 'Bodies In Boxes', type: 'Browser Game', tag: 'PLAY',
    url: 'https://savv4x.com/play?ref=tdots', preview: '/sites/bib-play-preview.jpg', clip: '/sites/bib-play-loop.mp4', icon: null,
    layout: { width: 300, height: 188, top: '5%', left: '2%' } },
  { name: 'Spoiled Kass', type: 'Creator Site',
    url: 'https://spoiledkass.com', preview: '/sites/spoiledkass-preview.jpg', icon: null, ...scrollThrough('spoiledkass'),
    layout: { width: 192, height: 120, top: '4%', left: '25%' } },
  { name: 'Dancehall Princess Canada', type: 'Series Site',
    url: 'https://dancehallprincess.ca', preview: '/sites/dancehallprincess-preview.jpg', icon: null, ...scrollThrough('dancehallprincess'),
    layout: { width: 192, height: 120, top: '4%', right: '25%' } },
  { name: 'Shortiie Raw', type: 'Artist Platform',
    url: 'https://shortiieraw.com', preview: '/sites/shortiieraw-preview.jpg', icon: null, ...scrollThrough('shortiieraw'),
    layout: { width: 200, height: 125, top: '43%', right: '25%' } },
  { name: 'ShairBraiding', type: 'Operator Site',
    url: 'https://shairbraiding.com', preview: '/sites/shair-preview.jpg', icon: null, ...scrollThrough('shairbraiding'),
    layout: { width: 300, height: 188, top: '5%', right: '2%' } },
  { name: 'Bali Whisper', type: 'Operator Site',
    url: 'https://baliwhisper.com', preview: '/sites/baliwhisper-preview.jpg', icon: null, ...scrollThrough('baliwhisper'),
    layout: { width: 280, height: 175, top: '74%', left: '2%' } },
  { name: 'Lodiie Harmony Tour', type: 'Artist Platform',
    url: 'https://lodiieharmonytour.com', preview: '/sites/lodiie-preview.jpg', icon: null, ...scrollThrough('lodiie'),
    layout: { width: 280, height: 175, top: '74%', right: '2%' } },
  { name: 'ShopBayHQ', type: 'Product',
    url: 'https://shopbayhq.com', preview: '/sites/shopbayhq-preview.jpg', icon: null, ...scrollThrough('shopbayhq'),
    layout: { width: 240, height: 150, top: '31%', left: '1%' } },
  { name: 'BetMetrics', type: 'Product',
    url: 'https://betmetrics.ca', preview: '/sites/betmetrics-preview.jpg', icon: null, ...scrollThrough('betmetrics'),
    layout: { width: 240, height: 150, top: '31%', right: '1%' } },
  { name: 'NirvanaDeshaun Builds', type: 'Business Site',
    url: 'https://nirvanadeshaunbuilds.com', preview: '/sites/nirvana-preview.jpg', icon: null, ...scrollThrough('nirvana'),
    layout: { width: 240, height: 150, top: '53%', left: '1%' } },
  { name: 'MustHaveFrenchies', type: 'Business Site',
    url: 'https://musthavefrenchies.com', preview: '/sites/frenchies-preview.jpg', icon: null, ...scrollThrough('frenchies'),
    layout: { width: 240, height: 150, top: '53%', right: '1%' } },
  { name: 'Street Bud', type: 'Artist Platform',
    url: 'https://officialstreetbud.com', preview: '/sites/streetbud-preview.jpg', icon: null, ...scrollThrough('streetbud'),
    layout: { width: 210, height: 131, top: '20%', left: '25%' } },
  { name: 'SAVV4X', type: 'Artist Platform',
    url: 'https://savv4x.com', preview: '/sites/savv-preview.jpg', icon: null, ...scrollThrough('savv4x'),
    layout: { width: 210, height: 131, top: '20%', right: '25%' } },
  { name: 'KMONEY', type: 'Artist Platform',
    url: 'https://officialkmoney.com', preview: '/sites/kmoney-preview.jpg', icon: null, ...scrollThrough('kmoney'),
    layout: { width: 210, height: 131, top: '66%', left: '25%' } },
  { name: 'SyrenEffect', type: 'Creator Site',
    url: 'https://syreneffect.com', preview: '/sites/syren-preview.jpg', icon: null, ...scrollThrough('syreneffect'),
    layout: { width: 210, height: 131, top: '66%', right: '25%' } },
  { name: '100BandPlan', type: 'Artist Platform',
    url: 'https://100bandplan.com', preview: '/sites/100bandplan-preview.jpg', icon: null, ...scrollThrough('100bandplan'),
    layout: { width: 200, height: 125, top: '43%', left: '25%' } },
]
