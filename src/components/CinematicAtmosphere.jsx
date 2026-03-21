/**
 * CinematicAtmosphere — Scroll-reactive ambient mood lighting + film grain.
 *
 * Renders two fixed layers over the HubPage:
 * 1. A radial gradient glow that shifts color as you scroll between sections
 * 2. A CSS-only film grain noise overlay (SVG feTurbulence via data URI)
 *
 * The atmosphere creates the "Culture Chronicle" narrative feel — each
 * section of the portfolio has its own mood lighting, like chapters in
 * a music video label's streaming platform.
 *
 * Zero dependencies beyond React. Film grain is pure CSS (no canvas).
 * Respects prefers-reduced-motion (grain animation stops, glow is static).
 */
import useAtmosphereScroll from '../hooks/useAtmosphereScroll'
import './CinematicAtmosphere.css'

export default function CinematicAtmosphere() {
  const { color, intensity } = useAtmosphereScroll()

  return (
    <>
      {/* Scroll-reactive ambient glow */}
      <div
        className="atmos-glow"
        aria-hidden="true"
        style={{
          '--atmos-color': color,
          '--atmos-intensity': intensity,
        }}
      />
      {/* Film grain noise overlay */}
      <div className="atmos-grain" aria-hidden="true" />
      {/* Cinematic vignette — darkened edges */}
      <div className="atmos-vignette" aria-hidden="true" />
    </>
  )
}
