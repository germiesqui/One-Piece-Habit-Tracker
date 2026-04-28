import { useRef, useEffect, useCallback, useState } from 'react'
import type { Arc, ArcProgress, PartyMember } from '@/types'
import {
  ISLANDS, MAP_IMG_W, MAP_IMG_H, ARC_ORDER,
  shipPosition, getShipImage,
} from './mapData'
import {
  drawRoute, drawIslandMarker, drawShipImage,
  drawTooltip, drawCrewPopup,
} from './mapDraw'

interface MapCanvasProps {
  currentArc:           Arc | null
  arcProgress:          ArcProgress | null
  members:              PartyMember[]
  completedArcNumbers:  number[]
  hiddenArcNumbers:     number[]
}

export function MapCanvas({
  currentArc,
  arcProgress,
  members,
  completedArcNumbers,
  hiddenArcNumbers,
}: MapCanvasProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const animRef       = useRef<number>(0)
  const pulseRef      = useRef(0)
  const merryRef      = useRef<HTMLImageElement | null>(null)
  const sunnyRef      = useRef<HTMLImageElement | null>(null)
  const imgLoadedRef  = useRef({ merry: false, sunny: false })

  const [imgSize, setImgSize]           = useState({ w: 0, h: 0 })
  const [tooltipArc, setTooltipArc]     = useState<number | null>(null)
  const [showCrew, setShowCrew]         = useState(false)
  const [imgReady, setImgReady]         = useState(false)

  const currentArcNum = currentArc?.arc_number ?? 1
  const arcPct = arcProgress && currentArc
    ? Math.min(100, Math.round((arcProgress.progress_xp / currentArc.xp_required) * 100))
    : 0

  // ---- Preload ship images ----
  useEffect(() => {
    const merry = new Image()
    merry.src = '/ships/going_merry.png'
    merry.onload = () => { imgLoadedRef.current.merry = true }
    merryRef.current = merry

    const sunny = new Image()
    sunny.src = '/ships/sunny.png'
    sunny.onload = () => { imgLoadedRef.current.sunny = true }
    sunnyRef.current = sunny
  }, [])

  // ---- Observe container size → sync canvas ----
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      const h = Math.round(width * (MAP_IMG_H / MAP_IMG_W))
      setImgSize({ w: Math.round(width), h })
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // ---- Sync canvas size to image size ----
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgSize.w) return
    const dpr     = window.devicePixelRatio || 1
    canvas.width  = imgSize.w * dpr
    canvas.height = imgSize.h * dpr
    canvas.style.width  = `${imgSize.w}px`
    canvas.style.height = `${imgSize.h}px`
  }, [imgSize])

  // ---- Render loop ----
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgSize.w || !imgSize.h) {
      animRef.current = requestAnimationFrame(render)
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cw  = imgSize.w
    const ch  = imgSize.h

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, cw, ch)

    pulseRef.current = (pulseRef.current + 0.02) % (Math.PI * 2)
    const pulse = (Math.sin(pulseRef.current) + 1) / 2

    // Route
    drawRoute(ctx, ISLANDS, currentArcNum, cw, ch)

    // Islands
    ISLANDS.forEach(island => {
      const isHidden    = hiddenArcNumbers.includes(island.arcNumber)
      const isCompleted = completedArcNumbers.includes(island.arcNumber)
      const isCurrent   = island.arcNumber === currentArcNum
      const state =
        isHidden    ? 'hidden'    :
        isCompleted ? 'completed' :
        isCurrent   ? 'current'   : 'future'
      drawIslandMarker(ctx, island, state, pulse, cw, ch)
    })

    // Ship
    const shipKind = getShipImage(currentArcNum)
    const shipImg  = shipKind === 'merry' ? merryRef.current : sunnyRef.current
    if (shipImg) {
      const pos   = shipPosition(currentArcNum, arcPct, cw, ch)
      const scale = Math.min(cw / MAP_IMG_W, ch / MAP_IMG_H) * 1.4

      // Tilt toward next island
      const routeIdx = ARC_ORDER.indexOf(currentArcNum)
      const nextNum  = ARC_ORDER[routeIdx + 1]
      const from     = ISLANDS.find(i => i.arcNumber === currentArcNum)
      const to       = ISLANDS.find(i => i.arcNumber === nextNum)
      let tilt = 0
      if (from && to) {
        tilt = Math.atan2(
          (to.y - from.y) * (ch / MAP_IMG_H),
          (to.x - from.x) * (cw / MAP_IMG_W),
        ) * 0.25
      }

      drawShipImage(ctx, shipImg, pos.x, pos.y, scale, tilt)
    }

    // Tooltip
    if (tooltipArc !== null) {
      const island = ISLANDS.find(i => i.arcNumber === tooltipArc)
      if (island) {
        const isCompleted = completedArcNumbers.includes(island.arcNumber)
        const isCurrent   = island.arcNumber === currentArcNum
        const isHidden    = hiddenArcNumbers.includes(island.arcNumber)
        const status =
          isHidden    ? '???' :
          isCompleted ? '✓ Completed' :
          isCurrent   ? `In progress — ${arcPct}%` :
                        'Not yet reached'
        drawTooltip(ctx, island, status, cw, ch, cw, ch)
      }
    }

    // Crew popup
    if (showCrew && members.length > 0) {
      const pos = shipPosition(currentArcNum, arcPct, cw, ch)
      drawCrewPopup(ctx, members, pos.x, pos.y, cw)
    }

    ctx.restore()
    animRef.current = requestAnimationFrame(render)
  }, [currentArcNum, arcPct, completedArcNumbers, hiddenArcNumbers,
      tooltipArc, showCrew, members, imgSize])

  useEffect(() => {
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  // ---- Tap handling ----
  function handleTap(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas || !imgSize.w) return

    const rect  = canvas.getBoundingClientRect()
    const tapX  = ('touches' in e ? e.touches[0]?.clientX : e.clientX) - rect.left
    const tapY  = ('touches' in e ? e.touches[0]?.clientY : e.clientY) - rect.top
    if (tapX === undefined || tapY === undefined) return

    const cw = imgSize.w
    const ch = imgSize.h

    // Check ship hit first
    const pos      = shipPosition(currentArcNum, arcPct, cw, ch)
    const scale    = Math.min(cw / MAP_IMG_W, ch / MAP_IMG_H) * 1.4
    const shipR    = 32 * scale
    const distShip = Math.hypot(tapX - pos.x, tapY - pos.y)
    if (distShip < shipR) {
      setShowCrew(p => !p)
      setTooltipArc(null)
      return
    }

    // Check island hit
    for (const island of ISLANDS) {
      const ix   = island.x * (cw / MAP_IMG_W)
      const iy   = island.y * (ch / MAP_IMG_H)
      const r    = island.size * Math.min(cw / MAP_IMG_W, ch / MAP_IMG_H) * 1.2
      const dist = Math.hypot(tapX - ix, tapY - iy)
      if (dist < r) {
        setTooltipArc(prev => prev === island.arcNumber ? null : island.arcNumber)
        setShowCrew(false)
        return
      }
    }

    setTooltipArc(null)
    setShowCrew(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ lineHeight: 0 }}
    >
      {/* Real map image — background */}
      <img
        src="/map.jpg"
        alt="Grand Line map"
        className="w-full block select-none"
        draggable={false}
        onLoad={() => setImgReady(true)}
        style={{ display: 'block' }}
      />

      {/* Canvas overlay — route, markers, ship, tooltips */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer"
        style={{ touchAction: 'manipulation' }}
        onClick={handleTap}
        onTouchEnd={e => { e.preventDefault(); handleTap(e) }}
      />

      {/* Dark gradient — bottom overlay for HUD text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,20,24,0.75) 0%, transparent 100%)' }}
      />

      {/* Hint */}
      <div className="absolute bottom-2 right-3 pointer-events-none">
        <p className="font-heading text-white/30"
           style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          tap islands · tap ship for crew
        </p>
      </div>
    </div>
  )
}