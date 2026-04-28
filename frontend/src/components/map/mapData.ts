// ============================================================
// Grand Line Chronicles — Map Data
// Coordinates calibrated against public/images/map.jpg
// Image natural size: ~2048 × ~1152px
// All x/y are pixel coordinates on the source image
// ============================================================

export interface IslandData {
  arcNumber:    number
  name:         string
  shortName:    string
  x:            number   // pixel X on source image
  y:            number   // pixel Y on source image
  bossName:     string | null
  isTransition: boolean
  size:         number   // hit-test radius on source image
}

export const ISLANDS: IslandData[] = [
  { arcNumber: 1,  name: 'Romance Dawn',         shortName: 'Shells Town',    x: 1774, y: 234,  bossName: 'Captain Morgan',        isTransition: false, size: 28 },
  { arcNumber: 2,  name: 'Orange Town',           shortName: 'Orange Town',    x: 1640, y: 334,  bossName: 'Buggy',                 isTransition: false, size: 26 },
  { arcNumber: 3,  name: 'Syrup Village',         shortName: 'Syrup Village',  x: 1506, y: 391,  bossName: 'Captain Kuro',          isTransition: false, size: 24 },
  { arcNumber: 4,  name: 'Baratie',               shortName: 'Baratie',        x: 1440, y: 473,  bossName: 'Don Krieg',             isTransition: false, size: 24 },
  { arcNumber: 5,  name: 'Arlong Park',           shortName: 'Arlong Park',    x: 1358, y: 317,  bossName: 'Arlong',                isTransition: false, size: 28 },
  { arcNumber: 6,  name: 'Loguetown',             shortName: 'Loguetown',      x: 1115, y: 596,  bossName: null,                    isTransition: true,  size: 20 },
  { arcNumber: 7,  name: 'Drum Island',           shortName: 'Drum Island',    x: 1346, y: 793,  bossName: 'Wapol',                 isTransition: false, size: 26 },
  { arcNumber: 8,  name: 'Alabasta',              shortName: 'Alabasta',       x: 1466, y: 793,  bossName: 'Crocodile',             isTransition: false, size: 30 },
  { arcNumber: 9,  name: 'Skypiea',               shortName: 'Skypiea',        x: 1580, y: 867,  bossName: 'Enel',                  isTransition: false, size: 28 },
  { arcNumber: 10, name: 'Enies Lobby',           shortName: 'Enies Lobby',    x: 1766, y: 853,  bossName: 'Rob Lucci',             isTransition: false, size: 28 },
  { arcNumber: 11, name: 'Thriller Bark',         shortName: 'Thriller Bark',  x: 636,  y: 1072, bossName: 'Gecko Moria',          isTransition: false, size: 26 },
  { arcNumber: 12, name: 'Sabaody Archipelago',   shortName: 'Sabaody',        x: 1903, y: 776,  bossName: null,                    isTransition: true,  size: 20 },
  { arcNumber: 13, name: 'Marineford',            shortName: 'Marineford',     x: 1900, y: 856,  bossName: 'Admiral Akainu',       isTransition: false, size: 28 },
  { arcNumber: 14, name: 'Fish-Man Island',       shortName: 'Fish-Man Is.',   x: 1988, y: 813,  bossName: 'Hody Jones',            isTransition: false, size: 24 },
  { arcNumber: 15, name: 'Dressrosa',             shortName: 'Dressrosa',      x: 334,  y: 833,  bossName: 'Donquixote Doflamingo', isTransition: false, size: 28 },
  { arcNumber: 16, name: 'Whole Cake Island',     shortName: 'WCI',            x: 599,  y: 861,  bossName: 'Big Mom',               isTransition: false, size: 26 },
  { arcNumber: 17, name: 'Wano Country',          shortName: 'Wano',           x: 491,  y: 756,  bossName: 'Kaido',                 isTransition: false, size: 30 },
  { arcNumber: 18, name: '???',                   shortName: '???',            x: 733,  y: 802,  bossName: null,                    isTransition: false, size: 26 },
]

// Source image natural dimensions (calibration reference)
export const MAP_IMG_W = 2048
export const MAP_IMG_H = 1152

// Arc order for the route line — story order, not geographic
export const ARC_ORDER = [1,2,3,4,5,6,7,8,9,10,12,13,14,11,15,16,17,18]

// Ship transition: Going Merry arcs 1-10, Sunny arc 11+
export function getShipImage(arcNumber: number): 'merry' | 'sunny' {
  return arcNumber <= 10 ? 'merry' : 'sunny'
}

// Interpolate ship position between two islands along the route
export function shipPosition(
  arcNumber: number,
  arcPct: number,         // 0–100
  imgW: number,           // rendered image width in px
  imgH: number,           // rendered image height in px
): { x: number; y: number } {
  const scaleX = imgW / MAP_IMG_W
  const scaleY = imgH / MAP_IMG_H

  const routeIdx  = ARC_ORDER.indexOf(arcNumber)
  const nextIdx   = routeIdx + 1
  const fromArc   = ISLANDS.find(i => i.arcNumber === arcNumber)
  const toArcNum  = ARC_ORDER[nextIdx]
  const toArc     = toArcNum ? ISLANDS.find(i => i.arcNumber === toArcNum) : null

  if (!fromArc) return { x: 0, y: 0 }
  if (!toArc)   return { x: fromArc.x * scaleX, y: fromArc.y * scaleY }

  const t      = arcPct / 100
  const smooth = t * t * (3 - 2 * t)   // smoothstep

  return {
    x: (fromArc.x + (toArc.x - fromArc.x) * smooth) * scaleX,
    y: (fromArc.y + (toArc.y - fromArc.y) * smooth) * scaleY,
  }
}