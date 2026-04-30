/**
 * WebDesignShowcase — Editorial grid showcasing web design projects.
 * Real favicons/previews for live sites, placeholder for upcoming.
 */
import { useRef } from 'react'
import useScrollReveal from '../hooks/useScrollReveal'
import SectionLabel from './ui/SectionLabel'
import './WebDesignShowcase.css'

const PROJECTS = [
  {
    name: 'SyrenEffect',
    type: 'Creator Site',
    description: 'Custom site for Twitch streamer — dark aesthetic, live integration, brand identity',
    status: 'Live',
    icon: '/sites/syren-icon.png',
    preview: null,
    url: 'https://syreneffect-site.vercel.app',
  },
  {
    name: 'Savv4x',
    type: 'Artist Platform',
    description: 'Personal brand site — portfolio, music, booking. Animated particles, now-playing bar',
    status: 'Live',
    icon: '/sites/savv-icon.png',
    preview: '/sites/savv-preview.jpg',
    url: 'https://savv4x.com',
  },
]

export default function WebDesignShowcase() {
  const sectionRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef, 0.15)

  return (
    <section
      className={`web-showcase ${isRevealed ? 'web-showcase--visible' : ''}`}
      ref={sectionRef}
      aria-label="Web Design Projects"
    >
      <SectionLabel text="WEB DESIGN" color="rgba(74, 124, 255, 0.45)" as="h2" />
      <p className="web-showcase__sub">Sites built for artists & creators</p>

      <div className="web-showcase__grid">
        {PROJECTS.map((project, i) => {
          const Wrapper = project.url ? 'a' : 'div'
          const linkProps = project.url
            ? { href: project.url, target: '_blank', rel: 'noopener noreferrer' }
            : {}

          return (
            <Wrapper
              key={project.name}
              className="web-showcase__card"
              style={{ '--card-delay': `${i * 120}ms` }}
              {...linkProps}
            >
              <div className="web-showcase__preview">
                {project.preview ? (
                  <img
                    src={project.preview}
                    alt={`${project.name} website preview`}
                    className="web-showcase__preview-img"
                    loading="lazy"
                  />
                ) : project.icon ? (
                  <div className="web-showcase__icon-wrap">
                    <img
                      src={project.icon}
                      alt={`${project.name} logo`}
                      className="web-showcase__icon"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="web-showcase__placeholder">
                    <span className="web-showcase__initial">{project.name[0]}</span>
                  </div>
                )}
                <span className={`web-showcase__status web-showcase__status--${project.status === 'Live' ? 'live' : 'soon'}`}>
                  {project.status}
                </span>
              </div>
              <div className="web-showcase__info">
                <span className="web-showcase__type">{project.type}</span>
                <h3 className="web-showcase__name">{project.name}</h3>
                <p className="web-showcase__desc">{project.description}</p>
              </div>
            </Wrapper>
          )
        })}
      </div>
    </section>
  )
}
