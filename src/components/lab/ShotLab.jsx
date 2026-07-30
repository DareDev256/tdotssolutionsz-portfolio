/**
 * ShotLab — the demo shell for the three footage-as-material concepts.
 *
 * Lives at /lab, entirely separate from the homepage, so all three can be
 * judged side by side without touching anything live. Whichever one wins gets
 * promoted; the other two get deleted.
 *
 * All three read the same pool (public/shots/manifest.json), which is the
 * argument being tested: the material is 13 years of directed footage, and the
 * only question is what instrument to play it with.
 *
 * @module components/lab/ShotLab
 */
import React, { useEffect, useState } from 'react'
import { useShots } from './useShots'
import Recut from './Recut'
import Archive from './Archive'
import Pad from './Pad'
import './lab.css'

const DEMOS = [
    {
        key: 'recut',
        n: '01',
        name: 'The Recut',
        line: 'A different film every visit',
        blurb:
            'One continuous film, generated from shots across the catalogue and cut on a tempo grid. Every visitor gets a different edit; the seed is in the URL, so any edit can be shared. Your reel is never the same twice and never out of date.'
    },
    {
        key: 'archive',
        n: '02',
        name: 'The Archive',
        line: 'Every shot, searchable',
        blurb:
            'The catalogue as a shot database rather than a portfolio — filter by light, colour, artist, year, or reorder the whole wall into a colour spectrum. It says "I have an archive" in a way a view count cannot, and it is actually useful to someone deciding whether to book you.'
    },
    {
        key: 'pad',
        n: '03',
        name: 'The Pad',
        line: 'Play the catalogue',
        blurb:
            'A 4x4 sampler where every pad is a shot with its audio. Hit pads on the keyboard, arm REC, and play a pattern out of thirteen years of drill videos. The only one of the three that is a toy — which is why people would send it to each other.'
    }
]

export default function ShotLab() {
    const { shots, loading, error } = useShots()
    const [active, setActive] = useState('recut')
    const [sound, setSound] = useState(false)

    useEffect(() => {
        document.body.classList.add('lab-body')
        return () => document.body.classList.remove('lab-body')
    }, [])

    // Sound is a page-level arm, shared by all three demos.
    const current = DEMOS.find((d) => d.key === active)

    return (
        <main className="lab">
            <header className="lab-head">
                <div className="lab-head__brand">
                    <svg viewBox="0 0 64 64" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d="M4 4h20v6H10v14H4V4Z" /><path d="M60 4v20h-6V10H40V4h20Z" />
                        <path d="M4 60V40h6v14h14v6H4Z" /><path d="M60 60H40v-6h14V40h6v20Z" />
                        <rect x="22" y="22" width="20" height="20" rx="1" />
                    </svg>
                    <span>TDS<i>/</i>SHOT LAB</span>
                </div>

                <nav className="lab-head__tabs" aria-label="Concepts">
                    {DEMOS.map((d) => (
                        <button
                            type="button"
                            key={d.key}
                            className={`lab-tab ${active === d.key ? 'is-on' : ''}`}
                            onClick={() => setActive(d.key)}
                        >
                            <b>{d.n}</b> {d.name}
                        </button>
                    ))}
                </nav>

                <button
                    type="button"
                    className={`lab-sound ${sound ? 'is-on' : ''}`}
                    onClick={() => setSound((s) => !s)}
                    aria-pressed={sound}
                >
                    {sound ? '♪ Sound on' : '♪ Sound off'}
                </button>
            </header>

            <section className="lab-intro">
                <h1>{current.line}</h1>
                <p>{current.blurb}</p>
                <span className="lab-intro__stat">
                    {loading ? 'loading pool…'
                        : error ? `pool failed: ${error}`
                        : `${shots.length} shots · ${new Set(shots.map((s) => s.film)).size} films · proof-of-concept pool (full catalogue = ~11,000 shots)`}
                </span>
            </section>

            <section className="lab-stage">
                {loading && <p className="lab-empty">Cutting…</p>}
                {error && (
                    <p className="lab-empty">
                        Couldn&rsquo;t load the shot pool. Run{' '}
                        <code>node scripts/build-shot-pool.mjs</code> first.
                    </p>
                )}
                {!loading && !error && shots.length > 0 && (
                    <>
                        {active === 'recut' && <Recut shots={shots} sound={sound} />}
                        {active === 'archive' && <Archive shots={shots} />}
                        {active === 'pad' && <Pad shots={shots} sound={sound} />}
                    </>
                )}
            </section>
        </main>
    )
}
