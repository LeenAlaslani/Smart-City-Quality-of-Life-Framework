// CityPulse Orb — original particle-sphere hero (2D canvas, no dependencies).
// Four connected ML domains (mobility, energy, public services, environment)
// converge from scattered points into a slowly-rotating orb on load, with
// subtle pointer parallax and scroll response. Honors prefers-reduced-motion,
// scales down on mobile, and pauses when off-screen.
import { useEffect, useRef } from 'react'

// Controlled cool palette — navy base, teal + cyan accents (no neon).
const DOMAINS = [
  { key: 'mobility', color: [63, 208, 230] },     // cyan
  { key: 'energy', color: [31, 163, 190] },       // teal
  { key: 'services', color: [90, 160, 224] },     // soft blue
  { key: 'environment', color: [47, 182, 166] },  // teal-green
]
// Tetrahedral domain axes (unit) — the 4 hub directions.
const AXES = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => {
  const l = Math.hypot(...v); return v.map((x) => x / l)
})
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export default function CityPulseOrb({ onFormed }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 640px)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const N = isMobile ? 120 : 260
    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    // ---- build sphere (fibonacci) + domain assignment + hubs ----
    const golden = Math.PI * (3 - Math.sqrt(5))
    const pts = []
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const th = i * golden
      const p = [Math.cos(th) * r, y, Math.sin(th) * r]
      // nearest domain axis
      let best = 0, bestDot = -2
      for (let a = 0; a < 4; a++) {
        const d = p[0] * AXES[a][0] + p[1] * AXES[a][1] + p[2] * AXES[a][2]
        if (d > bestDot) { bestDot = d; best = a }
      }
      // scattered start position (converges inward on load)
      const jitter = () => (Math.random() - 0.5) * 0.5
      pts.push({
        base: p, dom: best,
        start: [p[0] * 2.5 + jitter(), p[1] * 2.5 + jitter(), p[2] * 2.5 + jitter()],
        hub: false,
      })
    }
    // 4 hub nodes along the axes (larger, brighter)
    for (let a = 0; a < 4; a++) {
      pts.push({ base: AXES[a], dom: a, start: AXES[a].map((v) => v * 2.6), hub: true })
    }
    // neighbor pairs (each point → 2 nearest) for connective lines
    const pairs = []
    const seen = new Set()
    for (let i = 0; i < pts.length; i++) {
      const d = []
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue
        const a = pts[i].base, b = pts[j].base
        d.push([(a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2, j])
      }
      d.sort((x, y) => x[0] - y[0])
      for (let k = 0; k < (pts[i].hub ? 3 : 2); k++) {
        const j = d[k][1], key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (!seen.has(key)) { seen.add(key); pairs.push([i, j]) }
      }
    }

    // ---- state ----
    let W = 0, H = 0, cx = 0, cy = 0, R = 0
    const resize = () => {
      W = wrap.clientWidth; H = wrap.clientHeight
      canvas.width = W * DPR; canvas.height = H * DPR
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      cx = W / 2; cy = H / 2; R = Math.min(W, H) * (isMobile ? 0.34 : 0.36)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)

    let rotY = 0.6, rotX = -0.22
    let pRotY = 0, pRotX = 0, tRotY = 0, tRotX = 0
    let scrollY = 0
    const onPointer = (e) => {
      if (coarse) return
      const r = wrap.getBoundingClientRect()
      tRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.5
      tRotX = ((e.clientY - r.top) / r.height - 0.5) * 0.4
    }
    const onScroll = () => { scrollY = window.scrollY || 0 }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    const t0 = performance.now()
    const FORM_MS = 1700
    let formedFired = false
    let running = true
    // pause when hero scrolled away
    const io = new IntersectionObserver(([en]) => { running = en.isIntersecting }, { threshold: 0.02 })
    io.observe(wrap)

    const project = (p, ry, rx) => {
      // rotate Y then X
      let x = p[0] * Math.cos(ry) + p[2] * Math.sin(ry)
      let z = -p[0] * Math.sin(ry) + p[2] * Math.cos(ry)
      let y = p[1] * Math.cos(rx) - z * Math.sin(rx)
      z = p[1] * Math.sin(rx) + z * Math.cos(rx)
      const focal = 3.0
      const s = Math.max(0.3, Math.min(2.2, focal / (focal - z)))
      return { x: cx + x * s * R, y: cy + y * s * R, z, s }
    }

    let raf
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!running || window.__ORB_FREEZE__) return   // freeze hook (screenshot/testing)
      const elapsed = now - t0
      const t = reduce ? 1 : Math.min(1, elapsed / FORM_MS)
      const e = easeOutCubic(t)
      if (!formedFired && t >= 1) { formedFired = true; onFormed && onFormed() }

      // rotation: gentle auto + pointer parallax (lerp)
      pRotY += (tRotY - pRotY) * 0.05
      pRotX += (tRotX - pRotX) * 0.05
      if (!reduce) rotY += 0.0016
      const ry = rotY + pRotY, rx = rotX + pRotX

      // scroll parallax + fade
      const heroFade = Math.max(0, 1 - scrollY / (H * 0.9))
      const scrollShift = scrollY * 0.12

      ctx.clearRect(0, 0, W, H)
      ctx.save()
      ctx.translate(0, -scrollShift)
      ctx.globalAlpha = 1

      // current positions (formation lerp)
      const proj = pts.map((pt) => {
        const bp = pt.base, sp = pt.start
        const p = reduce ? bp : [
          sp[0] + (bp[0] - sp[0]) * e, sp[1] + (bp[1] - sp[1]) * e, sp[2] + (bp[2] - sp[2]) * e,
        ]
        return { ...project(p, ry, rx), pt }
      })

      // lines (fade in with formation, alpha by depth)
      if (t > 0.28) {
        const la = (t - 0.28) / 0.72
        for (let k = 0; k < pairs.length; k++) {
          const A = proj[pairs[k][0]], B = proj[pairs[k][1]]
          const depth = (A.z + B.z) / 2
          const a = Math.max(0, (depth + 1) / 2) * 0.32 * la * heroFade
          if (a < 0.015) continue
          ctx.strokeStyle = `rgba(96,178,214,${a})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()
        }
      }

      // particles (front-brighter)
      for (let i = 0; i < proj.length; i++) {
        const { x, y, z, s, pt } = proj[i]
        const depth = Math.max(0, Math.min(1, (z + 1) / 2)) // 0 back .. 1 front
        const [r, g, b] = DOMAINS[pt.dom].color
        const baseA = (0.28 + depth * 0.62) * heroFade * (reduce ? 1 : e)
        if (pt.hub) {
          // soft glow for hubs (sparingly)
          const rad = Math.max(0.5, (3.4 + depth * 3.6) * s)
          const grd = ctx.createRadialGradient(x, y, 0, x, y, rad * 3)
          grd.addColorStop(0, `rgba(${r},${g},${b},${0.5 * baseA})`)
          grd.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grd
          ctx.beginPath(); ctx.arc(x, y, rad * 3, 0, 6.2832); ctx.fill()
          ctx.fillStyle = `rgba(${r + 40},${g + 30},${b + 20},${Math.min(1, baseA + 0.25)})`
          ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill()
        } else {
          const rad = Math.max(0.2, (0.7 + depth * 1.7) * s)
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, baseA)})`
          ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill()
        }
      }
      ctx.restore()
    }
    raf = requestAnimationFrame(frame)
    if (reduce) { onFormed && onFormed() }

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [onFormed])

  return (
    <div ref={wrapRef} className="orb-wrap" aria-hidden="true">
      <div className="orb-halo" />
      <canvas ref={canvasRef} className="orb-canvas" />
    </div>
  )
}
