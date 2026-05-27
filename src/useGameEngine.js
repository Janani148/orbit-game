import { useEffect, useRef, useCallback } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TAU = Math.PI * 2

function normalizeAngle(a) {
  while (a < 0) a += TAU
  while (a > TAU) a -= TAU
  return a
}

function angleDiff(a, b) {
  let d = Math.abs(a - b)
  if (d > Math.PI) d = TAU - d
  return d
}

function isInGap(angle, ring) {
  const a = normalizeAngle(angle)
  const g = normalizeAngle(ring.gapAngle)
  return angleDiff(a, g) < ring.gapSize / 2
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// ─── useGameEngine ─────────────────────────────────────────────────────────────
export function useGameEngine(canvasRef, onScore, onDie, onStateChange) {
  const stateRef    = useRef('menu')
  const playerRef   = useRef(null)
  const ringsRef    = useRef([])
  const particlesRef= useRef([])
  const starsRef    = useRef([])
  const scoreRef    = useRef(0)
  const comboRef    = useRef(0)
  const rafRef      = useRef(null)
  const frameRef    = useRef(0)
  const ringTimerRef= useRef(0)
  const diffRef     = useRef(1)

  // ── Init stars ──────────────────────────────────────────────────────────────
  function initStars(W, H) {
    const arr = []
    for (let i = 0; i < 130; i++) {
      arr.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.3 + 0.2,
        t:  Math.random() * TAU,
        sp: Math.random() * 0.012 + 0.003,
      })
    }
    starsRef.current = arr
  }

  // ── Reset game state ────────────────────────────────────────────────────────
  function resetGame() {
    playerRef.current = {
      angle:  -Math.PI / 2,
      radius: 100,
      speed:  0.026,
      dir:    1,
      size:   10,
      trail:  [],
    }
    ringsRef.current    = []
    particlesRef.current= []
    scoreRef.current    = 0
    comboRef.current    = 0
    frameRef.current    = 0
    ringTimerRef.current= 0
    diffRef.current     = 1
    onScore(0, false)
  }

  // ── Spawn a ring ────────────────────────────────────────────────────────────
  function spawnRing(cx, cy, W, H) {
    const maxR = Math.min(W, H) * 0.44
    const minR = 44
    let r, attempts = 0
    do {
      r = minR + Math.random() * (maxR - minR)
      attempts++
    } while (Math.abs(r - playerRef.current.radius) < 28 && attempts < 20)

    const gapSize  = Math.max(0.52, 1.05 - diffRef.current * 0.06)
    const gapAngle = Math.random() * TAU
    const baseSpd  = 0.007 + Math.random() * 0.013
    const speed    = baseSpd * (Math.random() < 0.5 ? 1 : -1) * Math.max(1, diffRef.current * 0.5)
    const hue      = Math.random() * 80 + 190

    ringsRef.current.push({
      r, gapAngle, gapSize, speed,
      color: `hsl(${hue},75%,62%)`,
      alpha: 0,
      hitFlash: 0,
    })
  }

  // ── Spawn particles ─────────────────────────────────────────────────────────
  function spawnParticles(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * TAU
      const spd   = Math.random() * 4.5 + 1
      particlesRef.current.push({
        x, y,
        vx:   Math.cos(angle) * spd,
        vy:   Math.sin(angle) * spd,
        life: 1,
        color,
        size: Math.random() * 4 + 1,
      })
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(cx, cy, W, H) {
    if (stateRef.current !== 'play') return

    frameRef.current++
    const p   = playerRef.current
    const sc  = scoreRef.current
    diffRef.current = Math.min(3.5, 1 + sc * 0.004)

    // Move player
    p.angle += p.speed * p.dir
    const px  = cx + Math.cos(p.angle) * p.radius
    const py  = cy + Math.sin(p.angle) * p.radius

    // Trail
    p.trail.push({ x: px, y: py, life: 1 })
    if (p.trail.length > 24) p.trail.shift()
    p.trail.forEach(t => (t.life -= 0.042))

    // Spawn rings
    ringTimerRef.current++
    const interval = Math.max(48, 105 - sc * 0.6)
    if (ringTimerRef.current >= interval) {
      ringTimerRef.current = 0
      spawnRing(cx, cy, W, H)
    }

    // Update & check rings
    let crossed = false
    let dead    = false

    ringsRef.current.forEach(ring => {
      ring.gapAngle += ring.speed
      if (ring.alpha < 1) ring.alpha = Math.min(1, ring.alpha + 0.05)
      if (ring.hitFlash > 0) ring.hitFlash -= 0.09

      if (Math.abs(p.radius - ring.r) < p.size + 5) {
        const pa = normalizeAngle(p.angle)
        if (!isInGap(pa, ring)) {
          dead = true
          ring.hitFlash = 1
          spawnParticles(px, py, '#7ab4ff', 26)
        } else {
          crossed = true
        }
      }
    })

    if (dead) {
      stateRef.current = 'dead'
      onStateChange('dead', scoreRef.current)
      return
    }

    if (crossed) {
      scoreRef.current++
      comboRef.current++
      p.speed = Math.min(0.075, 0.026 + scoreRef.current * 0.0005)
      spawnParticles(px, py, '#ffd97a', 5)
      onScore(scoreRef.current, comboRef.current >= 3 ? comboRef.current : false)
    } else {
      comboRef.current = 0
    }

    // Remove rings that have drifted too far off-screen (cleanup)
    ringsRef.current = ringsRef.current.filter(r => r.alpha >= 0)

    // Particles
    particlesRef.current.forEach(pt => {
      pt.x += pt.vx; pt.y += pt.vy
      pt.vx *= 0.91;  pt.vy *= 0.91
      pt.life -= 0.028
    })
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0)

    // Stars twinkle
    starsRef.current.forEach(s => (s.t += s.sp))
  }

  // ── Draw ───────────────────────────────────────────────────────────────────
  function draw(ctx, cx, cy, W, H) {
    ctx.clearRect(0, 0, W, H)

    // Background
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75)
    bg.addColorStop(0, '#0d0d22')
    bg.addColorStop(1, '#060610')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Stars
    starsRef.current.forEach(s => {
      const a = 0.18 + Math.sin(s.t) * 0.22
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, TAU)
      ctx.fillStyle = `rgba(200,220,255,${a})`
      ctx.fill()
    })

    if (stateRef.current === 'menu') return

    const p  = playerRef.current
    const px = cx + Math.cos(p.angle) * p.radius
    const py = cy + Math.sin(p.angle) * p.radius

    // Center glow
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70)
    cg.addColorStop(0, 'rgba(80,120,255,0.18)')
    cg.addColorStop(1, 'rgba(80,120,255,0)')
    ctx.fillStyle = cg
    ctx.beginPath()
    ctx.arc(cx, cy, 70, 0, TAU)
    ctx.fill()

    // Center dot
    ctx.beginPath()
    ctx.arc(cx, cy, 3.5, 0, TAU)
    ctx.fillStyle = 'rgba(130,170,255,0.55)'
    ctx.fill()

    // Orbit guide (faint circle at player radius)
    ctx.beginPath()
    ctx.arc(cx, cy, p.radius, 0, TAU)
    ctx.strokeStyle = 'rgba(100,140,255,0.07)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Rings
    ringsRef.current.forEach(ring => {
      ctx.save()
      ctx.globalAlpha = ring.alpha

      const half  = ring.gapSize / 2
      const start = ring.gapAngle + half
      const end   = ring.gapAngle + TAU - half

      ctx.beginPath()
      ctx.arc(cx, cy, ring.r, start, end)
      ctx.strokeStyle = ring.hitFlash > 0
        ? `rgba(255,80,80,${ring.hitFlash})`
        : ring.color
      ctx.lineWidth   = 2.5
      ctx.shadowColor = ring.color
      ctx.shadowBlur  = 10
      ctx.stroke()
      ctx.shadowBlur  = 0

      // Gap indicator dot
      const gx = cx + Math.cos(ring.gapAngle) * ring.r
      const gy = cy + Math.sin(ring.gapAngle) * ring.r
      ctx.beginPath()
      ctx.arc(gx, gy, 4, 0, TAU)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fill()

      ctx.restore()
    })

    // Player trail
    p.trail.forEach((t, i) => {
      const a = t.life * 0.45
      const r = p.size * (i / p.trail.length) * 0.65
      ctx.beginPath()
      ctx.arc(t.x, t.y, Math.max(0.5, r), 0, TAU)
      ctx.fillStyle = `rgba(120,180,255,${a})`
      ctx.fill()
    })

    // Player glow
    const pg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 1.8)
    pg.addColorStop(0,   'rgba(200,225,255,1)')
    pg.addColorStop(0.45,'rgba(100,160,255,0.75)')
    pg.addColorStop(1,   'rgba(60,100,255,0)')
    ctx.beginPath()
    ctx.arc(px, py, p.size * 1.8, 0, TAU)
    ctx.fillStyle = pg
    ctx.fill()

    // Player core
    ctx.beginPath()
    ctx.arc(px, py, p.size * 0.55, 0, TAU)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    // Particles
    particlesRef.current.forEach(pt => {
      ctx.save()
      ctx.globalAlpha = pt.life
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, TAU)
      ctx.fillStyle = pt.color
      ctx.fill()
      ctx.restore()
    })
  }

  // ── Game loop ───────────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function loop() {
      const W  = canvas.width
      const H  = canvas.height
      const cx = W / 2
      const cy = H / 2
      update(cx, cy, W, H)
      draw(ctx, cx, cy, W, H)
      rafRef.current = requestAnimationFrame(loop)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    loop()
  }, [])

  // ── Tap handler ─────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    const s = stateRef.current

    if (s === 'menu') {
      resetGame()
      stateRef.current = 'play'
      onStateChange('play', 0)
      return
    }

    if (s === 'play') {
      const p = playerRef.current
      if (!p) return
      // Reverse orbit direction
      p.dir *= -1
      // Shift radius
      const jump  = 26 + Math.random() * 18
      const delta = Math.random() < 0.5 ? jump : -jump
      const canvas= canvasRef.current
      const maxR  = Math.min(canvas.width, canvas.height) * 0.43
      p.radius    = Math.max(36, Math.min(maxR, p.radius + delta))
      return
    }

    if (s === 'dead') {
      resetGame()
      stateRef.current = 'play'
      onStateChange('play', 0)
    }
  }, [])

  // ── Mount ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      initStars(canvas.width, canvas.height)
    }

    resize()
    startLoop()

    window.addEventListener('resize', resize)
    canvas.addEventListener('pointerdown', handleTap)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', handleTap)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { handleTap }
}
