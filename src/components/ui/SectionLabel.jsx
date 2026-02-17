/**
 * SectionLabel — Shared neon "line / text / line" divider used across HubPage sections.
 *
 * Replaces duplicated label markup + CSS in VideoSpotlight, CollabWeb,
 * ArtistShowcase, and EraTimeline with a single source of truth.
 *
 * @param {string}  text  - Label text (e.g. "SPOTLIGHT", "COLLAB WEB")
 * @param {string}  color - Neon accent color (e.g. "rgba(255,0,128,0.6)")
 * @param {string}  [as]  - Wrapper element type: "div" (default) or "h2"
 * @param {string}  [className] - Additional class names
 */
import './SectionLabel.css'

export default function SectionLabel({ text, color, as: Tag = 'span', className = '' }) {
  return (
    <div className={`section-label ${className}`.trim()} style={{ '--label-color': color }}>
      <span className="section-label__line" aria-hidden="true" />
      {Tag === 'h2'
        ? <h2 className="section-label__text">{text}</h2>
        : <span className="section-label__text">{text}</span>
      }
      <span className="section-label__line" aria-hidden="true" />
    </div>
  )
}
