// ============================================================
// Grand Line Chronicles — Map Canvas Drawing Utilities
// Draws ONLY the overlay — route, markers, ship, tooltips
// The background is the real map image rendered in <img>
// ============================================================

import type { IslandData } from './mapData'
import { MAP_IMG_W, MAP_IMG_H, ARC_ORDER } from './mapData'

// Scale helpers
function sx(x: number, imgW: number) { return x * (imgW / MAP_IMG_W) }
function sy(y: number, imgH: number) { return y * (imgH / MAP_IMG_H) }

// ---- Route line ----
export function drawRoute(
  ctx: CanvasRenderingContext2D,
  islands: IslandData[],
  currentArcNumber: number,
  imgW: number,
  imgH: number,
) {
  if (ARC_ORDER.length < 2) return
  ctx.save()

  for (let i = 0; i < ARC_ORDER.length - 1; i++) {
    const fromNum = ARC_ORDER[i]
    const toNum   = ARC_ORDER[i + 1]
    const from    = islands.find(is => is.arcNumber === fromNum)
    const to      = islands.find(is => is.arcNumber === toNum)
    if (!from || !to) continue

    const isPast = toNum <= currentArcNumber

    const x1 = sx(from.x, imgW)
    const y1 = sy(from.y, imgH)
    const x2 = sx(to.x,   imgW)
    const y2 = sy(to.y,   imgH)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)

    if (isPast) {
      ctx.strokeStyle = 'rgba(201,149,46,0.7)'
      ctx.lineWidth   = 2.5
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = 'rgba(249,241,220,0.25)'
      ctx.lineWidth   = 1.5
      ctx.setLineDash([5, 7])
    }
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.restore()
}

// ---- Island marker ----
export function drawIslandMarker(
  ctx: CanvasRenderingContext2D,
  island: IslandData,
  state: 'completed' | 'current' | 'future' | 'hidden',
  pulse: number,    // 0–1
  imgW: number,
  imgH: number,
) {
  const x = sx(island.x, imgW)
  const y = sy(island.y, imgH)
  const r = island.size * Math.min(imgW / MAP_IMG_W, imgH / MAP_IMG_H) * 0.55

  ctx.save()

  if (state === 'hidden') {
    ctx.globalAlpha = 0.2
    ctx.fillStyle   = '#f2e0b0'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  // Pulse ring for current island
  if (state === 'current') {
    const pulseR = r + 4 + pulse * 8
    ctx.globalAlpha = (1 - pulse) * 0.6
    ctx.strokeStyle = '#f75528'
    ctx.lineWidth   = 2
    ctx.beginPath()
    ctx.arc(x, y, pulseR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Glow
  if (state === 'completed') {
    ctx.shadowColor = 'rgba(201,149,46,0.8)'
    ctx.shadowBlur  = 10
  } else if (state === 'current') {
    ctx.shadowColor = 'rgba(247,85,40,0.9)'
    ctx.shadowBlur  = 14 + pulse * 6
  } else {
    ctx.globalAlpha = 0.45
  }

  // Dot
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle =
    state === 'completed' ? 'rgba(201,149,46,0.85)' :
    state === 'current'   ? 'rgba(247,85,40,0.9)'   :
                            'rgba(249,241,220,0.3)'
  ctx.fill()

  ctx.strokeStyle =
    state === 'completed' ? '#c9952e' :
    state === 'current'   ? '#f75528' :
                            'rgba(249,241,220,0.4)'
  ctx.lineWidth = state === 'current' ? 2 : 1.5
  ctx.stroke()

  ctx.shadowBlur  = 0
  ctx.globalAlpha = state === 'future' ? 0.5 : 1

  // Label
  const scale   = Math.min(imgW / MAP_IMG_W, imgH / MAP_IMG_H)
  const fs      = Math.max(9, Math.round(11 * scale))
  ctx.font         = `600 ${fs}px Cinzel, serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  ctx.shadowColor  = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur   = 5
  ctx.fillStyle    =
    state === 'completed' ? '#f2c85a' :
    state === 'current'   ? '#ffb89a' :
                            'rgba(242,224,176,0.7)'
  ctx.fillText(island.shortName, x, y + r + 3)
  ctx.shadowBlur = 0

  ctx.restore()
}

// ---- Ship image ----
export function drawShipImage(
  ctx: CanvasRenderingContext2D,
  shipImg: HTMLImageElement,
  x: number,
  y: number,
  scale: number,     // based on canvas size
  tiltRad: number,
) {
  if (!shipImg.complete || !shipImg.naturalWidth) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tiltRad)

  const w = 60 * scale
  const h = 60 * scale * (shipImg.naturalHeight / shipImg.naturalWidth)

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur  = 8
  ctx.drawImage(shipImg, -w / 2, -h, w, h)
  ctx.shadowBlur  = 0

  ctx.restore()
}

// ---- Island tooltip ----
export function drawTooltip(
  ctx: CanvasRenderingContext2D,
  island: IslandData,
  statusLabel: string,
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number,
) {
  const ix = sx(island.x, imgW)
  const iy = sy(island.y, imgH)
  const r  = island.size * Math.min(imgW / MAP_IMG_W, imgH / MAP_IMG_H) * 0.55

  const lines = [
    island.name,
    statusLabel,
    island.bossName ? `Boss: ${island.bossName}` : null,
  ].filter(Boolean) as string[]

  const pad  = 9
  const lh   = 15
  const boxW = 160
  const boxH = lines.length * lh + pad * 2

  let bx = ix - boxW / 2
  let by = iy - r - boxH - 10
  bx = Math.max(4, Math.min(canvasW - boxW - 4, bx))
  by = Math.max(4, by)

  ctx.save()
  ctx.fillStyle   = 'rgba(13,25,20,0.93)'
  ctx.strokeStyle = 'rgba(201,149,46,0.65)'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.roundRect(bx, by, boxW, boxH, 5)
  ctx.fill()
  ctx.stroke()

  lines.forEach((line, i) => {
    ctx.fillStyle    =
      i === 0 ? '#f2e0b0' :
      i === 2 ? '#f75528' :
                'rgba(242,224,176,0.55)'
    ctx.font         = i === 0 ? '600 10px Cinzel, serif' : '400 9px Cinzel, serif'
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(line, bx + pad, by + pad + i * lh)
  })

  ctx.restore()
}

// ---- Crew popup ----
export function drawCrewPopup(
  ctx: CanvasRenderingContext2D,
  members: { username: string; avatar_emoji: string | null; character_name: string | null }[],
  sx_: number,
  sy_: number,
  canvasW: number,
) {
  if (!members.length) return

  const cols  = Math.min(members.length, 4)
  const cellW = 58
  const cellH = 54
  const pad   = 9
  const boxW  = cols * cellW + pad * 2
  const boxH  = Math.ceil(members.length / cols) * cellH + pad * 2 + 18

  let bx = sx_ - boxW / 2
  let by = sy_ - boxH - 16
  bx = Math.max(4, Math.min(canvasW - boxW - 4, bx))
  by = Math.max(4, by)

  ctx.save()
  ctx.fillStyle   = 'rgba(13,25,20,0.95)'
  ctx.strokeStyle = 'rgba(201,149,46,0.65)'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.roundRect(bx, by, boxW, boxH, 6)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle    = 'rgba(201,149,46,0.8)'
  ctx.font         = '600 9px Cinzel, serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('THE CREW', bx + boxW / 2, by + pad)

  members.forEach((m, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx  = bx + pad + col * cellW + cellW / 2
    const cy  = by + pad + 18 + row * cellH

    ctx.font         = '20px serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(m.avatar_emoji ?? '🏴', cx, cy + 10)

    ctx.fillStyle    = 'rgba(242,224,176,0.9)'
    ctx.font         = '400 8px Cinzel, serif'
    ctx.textBaseline = 'top'
    ctx.fillText(
      m.username.length > 7 ? m.username.slice(0, 6) + '…' : m.username,
      cx, cy + 24
    )
    ctx.fillStyle = 'rgba(201,149,46,0.8)'
  })
  ctx.restore()
}