/**
 * LegalPage — shared shell for /privacy and /terms.
 *
 * Plain, static, dark-palette page matching the site's typography tokens
 * (--font-display / --font-mono / --font-body, --dark-bg, --accent-blue).
 * No neon, no synthwave, no new "sections" on the hub — this is its own
 * standalone route, not an addition to HubPageCinema.
 *
 * @module components/LegalPage
 */
import { Link } from 'react-router-dom'
import './LegalPage.css'

const CONTACT_EMAIL = 'dev@jamesdare.com'
const LAST_UPDATED = '2026-09-13'

/**
 * @param {{title: string, children: import('react').ReactNode}} props
 */
export default function LegalPage({ title, children }) {
    return (
        <div className="legal-page">
            <a href="#legal-main" className="skip-nav">Skip to content</a>
            <header className="legal-header">
                <Link to="/" className="legal-home-link">TdotsSolutionsz</Link>
            </header>
            <main id="legal-main" className="legal-body">
                <h1 className="legal-title">{title}</h1>
                <p className="legal-updated">Last updated {LAST_UPDATED}</p>
                {children}
                <p className="legal-contact">
                    Questions about this page: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </p>
                <nav className="legal-footer-nav">
                    <Link to="/">Home</Link>
                    <span aria-hidden="true">&middot;</span>
                    <Link to="/privacy">Privacy</Link>
                    <span aria-hidden="true">&middot;</span>
                    <Link to="/terms">Terms</Link>
                </nav>
            </main>
        </div>
    )
}

export { CONTACT_EMAIL, LAST_UPDATED }
