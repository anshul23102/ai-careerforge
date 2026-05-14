'use client'

import { useEffect, useRef } from 'react'

const STARS = [
  { top: "8%",  left: "12%", d: "3.2s", delay: "0s"   },
  { top: "15%", left: "28%", d: "4.1s", delay: "0.5s" },
  { top: "5%",  left: "45%", d: "2.8s", delay: "1s"   },
  { top: "20%", left: "65%", d: "3.7s", delay: "0.3s" },
  { top: "10%", left: "82%", d: "4.5s", delay: "0.8s" },
  { top: "35%", left: "5%",  d: "3.1s", delay: "1.5s" },
  { top: "45%", left: "90%", d: "2.6s", delay: "0.2s" },
  { top: "60%", left: "18%", d: "3.9s", delay: "1.1s" },
  { top: "70%", left: "73%", d: "4.2s", delay: "0.7s" },
  { top: "80%", left: "40%", d: "3.4s", delay: "1.8s" },
  { top: "25%", left: "52%", d: "2.9s", delay: "0.4s" },
  { top: "3%",  left: "72%", d: "3.6s", delay: "2s"   },
  { top: "88%", left: "55%", d: "4.3s", delay: "0.6s" },
  { top: "55%", left: "33%", d: "3.8s", delay: "1.2s" },
  { top: "42%", left: "78%", d: "4.0s", delay: "0.9s" },
]

export default function StarField() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let tx = 0, ty = 0
    let cx = 0, cy = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth  - 0.5) * 14
      ty = (e.clientY / window.innerHeight - 0.5) * 14
    }

    function tick() {
      cx += (tx - cx) * 0.05
      cy += (ty - cy) * 0.05
      if (ref.current) {
        ref.current.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    tick()
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', inset: '-20px', zIndex: 1, pointerEvents: 'none', willChange: 'transform' }}
    >
      {STARS.map((s, i) => (
        <div
          key={i}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            '--duration': s.d,
            '--delay': s.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
