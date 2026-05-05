import { useEffect, useRef, useState } from 'react'
import './AudioBed.css'

const STORAGE_KEY = 'tdots:audio:enabled'

export default function AudioBed() {
  const ctxRef = useRef(null)
  const nodesRef = useRef(null)
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
    if (enabled) start()
    else stop()
    return stop
  }, [enabled])

  function start() {
    if (ctxRef.current) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ctxRef.current = ctx

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1400
    filter.Q.value = 0.7
    filter.connect(master)

    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = 60
    osc1.connect(filter)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 80.5
    osc2.connect(filter)

    const osc3 = ctx.createOscillator()
    osc3.type = 'triangle'
    osc3.frequency.value = 160
    const oscGain = ctx.createGain()
    oscGain.gain.value = 0.18
    osc3.connect(oscGain).connect(filter)

    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.12
    lfoGain.gain.value = 4
    lfo.connect(lfoGain).connect(osc1.frequency)

    osc1.start()
    osc2.start()
    osc3.start()
    lfo.start()

    master.gain.linearRampToValueAtTime(0.075, ctx.currentTime + 1.4)
    nodesRef.current = { master, osc1, osc2, osc3, lfo, filter }
  }

  function stop() {
    const ctx = ctxRef.current
    const nodes = nodesRef.current
    if (!ctx || !nodes) return
    const t = ctx.currentTime
    nodes.master.gain.cancelScheduledValues(t)
    nodes.master.gain.setValueAtTime(nodes.master.gain.value, t)
    nodes.master.gain.linearRampToValueAtTime(0, t + 0.6)
    setTimeout(() => {
      try {
        nodes.osc1.stop(); nodes.osc2.stop(); nodes.osc3.stop(); nodes.lfo.stop()
        ctx.close()
      } catch {}
      ctxRef.current = null
      nodesRef.current = null
    }, 800)
  }

  return (
    <button
      type="button"
      className={`audio-bed-toggle ${enabled ? 'audio-bed-toggle--on' : ''}`}
      aria-label={enabled ? 'Mute ambient audio' : 'Unmute ambient audio'}
      aria-pressed={enabled}
      onClick={() => setEnabled(v => !v)}
    >
      <span className="audio-bed-toggle__icon" aria-hidden="true">
        {enabled ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </span>
      <span className="audio-bed-toggle__label">
        {enabled ? 'AMBIENT ON' : 'AMBIENT OFF'}
      </span>
    </button>
  )
}
