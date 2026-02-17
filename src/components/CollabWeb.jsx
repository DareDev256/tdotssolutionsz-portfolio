/**
 * CollabWeb — Interactive artist collaboration network for the HubPage.
 * Parses "ft." from video titles/descriptions to build a graph of artist
 * connections, displayed as clickable neon nodes with animated connection lines.
 * Clicking a node highlights that artist's collaborations.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import './CollabWeb.css'

/** Extract collaborations from video data */
function buildCollabGraph() {
  const collabs = []
  for (const v of VIDEOS) {
    const ftMatch = (v.title + ' ' + (v.description || '')).match(/ft\.?\s+(.+?)(?:\s*[-–—(]|$)/i)
    if (!ftMatch) continue
    const featured = ftMatch[1]
      .split(/[,&]/)
      .map(s => s.replace(/\(.*$/, '').trim())
      .filter(Boolean)
    for (const feat of featured) {
      collabs.push({ primary: v.artist, featured: feat, video: v })
    }
  }
  return collabs
}

/** Build node + edge data from collabs */
function buildNetwork(collabs) {
  const nodeMap = new Map()
  const edges = []

  for (const c of collabs) {
    for (const name of [c.primary, c.featured]) {
      if (!nodeMap.has(name)) {
        nodeMap.set(name, { name, collabCount: 0, videos: [] })
      }
    }
    nodeMap.get(c.primary).collabCount++
    nodeMap.get(c.primary).videos.push(c.video)
    nodeMap.get(c.featured).collabCount++
    nodeMap.get(c.featured).videos.push(c.video)
    edges.push({ from: c.primary, to: c.featured, video: c.video })
  }

  const nodes = [...nodeMap.values()].sort((a, b) => b.collabCount - a.collabCount)
  return { nodes, edges }
}

const NEON = ['#ff2a6d', '#05d9e8', '#d300c5', '#7700ff', '#ff6b35', '#ffcc00', '#00ff88']

export default function CollabWeb() {
  const [activeNode, setActiveNode] = useState(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const sectionRef = useRef(null)

  const collabs = useMemo(() => buildCollabGraph(), [])
  const { nodes, edges } = useMemo(() => buildNetwork(collabs), [collabs])

  // Scroll-reveal
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsRevealed(true) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const activeEdges = activeNode
    ? edges.filter(e => e.from === activeNode || e.to === activeNode)
    : []
  const connectedNames = new Set(activeEdges.flatMap(e => [e.from, e.to]))

  return (
    <section
      className={`collab-web ${isRevealed ? 'revealed' : ''}`}
      ref={sectionRef}
      aria-label="Artist collaboration network"
    >
      <div className="collab-label">
        <span className="collab-label-line" />
        <span className="collab-label-text">COLLAB WEB</span>
        <span className="collab-label-line" />
      </div>
      <p className="collab-subtitle">{edges.length} collaborations across {nodes.length} artists</p>

      <div className="collab-nodes" role="list" aria-label="Artists with collaborations">
        {nodes.map((node, i) => {
          const color = NEON[i % NEON.length]
          const isActive = activeNode === node.name
          const isConnected = activeNode && connectedNames.has(node.name)
          const isDimmed = activeNode && !isConnected && !isActive
          return (
            <button
              key={node.name}
              className={`collab-node ${isActive ? 'active' : ''} ${isConnected ? 'connected' : ''} ${isDimmed ? 'dimmed' : ''}`}
              style={{ '--node-color': color }}
              onClick={() => setActiveNode(isActive ? null : node.name)}
              role="listitem"
              aria-pressed={isActive}
              aria-label={`${node.name} — ${node.collabCount} collaboration${node.collabCount > 1 ? 's' : ''}`}
              type="button"
            >
              <span className="collab-node-name">{node.name}</span>
              <span className="collab-node-count">{node.collabCount}</span>
            </button>
          )
        })}
      </div>

      {activeNode && activeEdges.length > 0 && (
        <div className="collab-detail" role="region" aria-label={`Collaborations with ${activeNode}`}>
          <h3 className="collab-detail-title">
            <span className="collab-detail-artist">{activeNode}</span>
            <span className="collab-detail-sep">×</span>
            <span className="collab-detail-count">{activeEdges.length} collab{activeEdges.length > 1 ? 's' : ''}</span>
          </h3>
          <div className="collab-detail-tracks">
            {activeEdges.map((edge, i) => (
              <Link
                key={`${edge.video.youtubeId}-${i}`}
                to={`/videos?v=${edge.video.youtubeId}`}
                className="collab-track"
              >
                <img
                  src={getThumbnailUrl(edge.video.youtubeId, 'default')}
                  alt=""
                  className="collab-track-thumb"
                  width="120"
                  height="90"
                  loading="lazy"
                />
                <div className="collab-track-info">
                  <span className="collab-track-title">{edge.video.title}</span>
                  <span className="collab-track-views">{formatViews(edge.video.viewCount)} views</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
