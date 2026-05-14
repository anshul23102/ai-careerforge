'use client'

import { useEffect, useRef } from 'react'

interface Point {
  x: number; y: number; ox: number; oy: number; vx: number; vy: number
}


export default function InteractiveMesh() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const mouseRef   = useRef({ x: -9999, y: -9999 })
  const animRef    = useRef<number>(0)
  const pointsRef  = useRef<Point[]>([])
  const timeRef    = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const c = canvas
    const g = ctx

    const COLS           = 40
    const ROWS           = 28
    const SPRING         = 0.035
    const DAMPING        = 0.88
    const MOUSE_RADIUS   = 160
    const MOUSE_STRENGTH = 7
    // ── Mesh init ──
    function resize() {
      c.width  = window.innerWidth
      c.height = window.innerHeight
      initMesh()
    }

    function initMesh() {
      pointsRef.current = []
      for (let r = 0; r <= ROWS; r++) {
        for (let col = 0; col <= COLS; col++) {
          const ox = (col / COLS) * c.width
          const oy = (r   / ROWS) * c.height
          pointsRef.current.push({ x: ox, y: oy, ox, oy, vx: 0, vy: 0 })
        }
      }
    }

    function updateMesh() {
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (const p of pointsRef.current) {
        const fx = -SPRING * (p.x - p.ox)
        const fy = -SPRING * (p.y - p.oy)
        const dx   = p.x - mx
        const dy   = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) ** 2
          const angle = Math.atan2(dy, dx)
          p.vx += Math.cos(angle) * force * MOUSE_STRENGTH
          p.vy += Math.sin(angle) * force * MOUSE_STRENGTH
        }
        p.vx = (p.vx + fx) * DAMPING
        p.vy = (p.vy + fy) * DAMPING
        p.x  += p.vx
        p.y  += p.vy
      }
    }

function getColor(displacement: number, t: number, alpha: number): string {
      const hue  = (210 + displacement * 2.5 + Math.sin(t) * 15) % 360
      const sat  = 60 + Math.min(displacement * 1.5, 35)
      const lgt  = 60 + Math.min(displacement * 0.5, 20)
      return `hsla(${hue.toFixed(0)},${sat.toFixed(0)}%,${lgt.toFixed(0)}%,${alpha.toFixed(3)})`
    }

function drawMesh(t: number) {
      const W = COLS + 1

      // Horizontal lines
      for (let r = 0; r <= ROWS; r++) {
        for (let col = 0; col < COLS; col++) {
          const p1 = pointsRef.current[r * W + col]
          const p2 = pointsRef.current[r * W + col + 1]
          const d1 = Math.sqrt((p1.x - p1.ox) ** 2 + (p1.y - p1.oy) ** 2)
          const d2 = Math.sqrt((p2.x - p2.ox) ** 2 + (p2.y - p2.oy) ** 2)
          const avgD = (d1 + d2) / 2
          const alpha = Math.min(0.025 + avgD * 0.007, 0.18)
          const grad = g.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
          grad.addColorStop(0, getColor(d1, t, alpha))
          grad.addColorStop(1, getColor(d2, t + 0.3, alpha))
          g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y)
          g.strokeStyle = grad
          g.lineWidth   = avgD > 5 ? 0.5 : 0.3
          g.stroke()
        }
      }

      // Vertical lines
      for (let r = 0; r < ROWS; r++) {
        for (let col = 0; col <= COLS; col++) {
          const p1 = pointsRef.current[r * W + col]
          const p2 = pointsRef.current[(r + 1) * W + col]
          const d1 = Math.sqrt((p1.x - p1.ox) ** 2 + (p1.y - p1.oy) ** 2)
          const d2 = Math.sqrt((p2.x - p2.ox) ** 2 + (p2.y - p2.oy) ** 2)
          const avgD = (d1 + d2) / 2
          const alpha = Math.min(0.025 + avgD * 0.007, 0.18)
          const grad = g.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
          grad.addColorStop(0, getColor(d1, t + 0.5, alpha))
          grad.addColorStop(1, getColor(d2, t + 0.8, alpha))
          g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y)
          g.strokeStyle = grad
          g.lineWidth   = avgD > 5 ? 0.5 : 0.3
          g.stroke()
        }
      }

      // Glow dots on displaced intersections
      for (const p of pointsRef.current) {
        const d = Math.sqrt((p.x - p.ox) ** 2 + (p.y - p.oy) ** 2)
        if (d > 6) {
          const alpha = Math.min(d * 0.012, 0.22)
          const hue   = (220 + d * 3 + t * 20) % 360
          g.beginPath()
          g.arc(p.x, p.y, Math.min(d * 0.07, 1.5), 0, Math.PI * 2)
          g.fillStyle = `hsla(${hue.toFixed(0)},70%,75%,${alpha.toFixed(3)})`
          g.fill()
        }
      }

      // Soft cursor aura
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      if (mx > 0 && my > 0) {
        const aura = g.createRadialGradient(mx, my, 0, mx, my, 120)
        aura.addColorStop(0,   'rgba(110,180,255,0.03)')
        aura.addColorStop(0.5, 'rgba(165,180,252,0.015)')
        aura.addColorStop(1,   'rgba(0,0,0,0)')
        g.beginPath(); g.arc(mx, my, 120, 0, Math.PI * 2)
        g.fillStyle = aura; g.fill()
      }
    }

    function loop() {
      timeRef.current += 0.008
      updateMesh()
      g.clearRect(0, 0, c.width, c.height)
      drawMesh(timeRef.current)
      animRef.current = requestAnimationFrame(loop)
    }

    const onMouseMove  = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const onMouseLeave = ()              => { mouseRef.current = { x: -9999, y: -9999 } }

    resize()
    loop()
    window.addEventListener('resize',    resize)
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize',    resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    />
  )
}
