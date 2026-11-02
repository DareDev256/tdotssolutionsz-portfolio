import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { renderStaticCopy } from './scripts/static-copy.mjs'
import { VIDEOS, PORTFOLIO_STATS } from './src/utils/videoData.js'
import { formatViews } from './src/utils/formatters.js'
import { WEB_PROJECTS } from './src/data/webProjects.js'
import { DOORS, DOORS_TO } from './src/data/doors.js'

/* 6.19.0: write the hub's words into #root as hidden HTML for readers that never run JS (AI search crawlers).
   Same modules the hub renders, at build time; a missing marker or an empty source fails the build. */
const STATIC_COPY_MARK = '<!--STATIC-COPY-->'
function staticCopy() {
    return {
        name: 'tdots-static-copy',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                if (!html.includes(STATIC_COPY_MARK)) throw new Error(`static-copy: ${STATIC_COPY_MARK} missing from index.html`)
                return html.replace(STATIC_COPY_MARK, renderStaticCopy({
                    videos: VIDEOS, stats: PORTFOLIO_STATS, projects: WEB_PROJECTS,
                    doors: DOORS, inbox: DOORS_TO, formatViews,
                }))
            },
        },
    }
}

export default defineConfig({
    plugins: [react(), staticCopy()],
    server: {
        port: 5175,
        open: true
    },
    build: {
        // Prevent source maps from exposing original source in production
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
                    'vendor-postprocessing': ['postprocessing', '@react-three/postprocessing'],
                }
            }
        }
    }
})
