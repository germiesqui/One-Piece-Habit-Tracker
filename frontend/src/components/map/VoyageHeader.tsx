import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Arc, ArcProgress } from '@/types'

// ---- Island destination image ----
// Place real images at public/islands/{slug}.jpg later
// Slug is arc name lowercased, spaces → underscores
function islandSlug(arcName: string): string {
  return arcName.toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

// Colour palette per arc — used for placeholder cards
// When a real image exists at /islands/{slug}.jpg it takes over
const ARC_COLORS: Record<number, { from: string; to: string; accent: string }> = {
  1:  { from: '#1a4a2e', to: '#0d2b1a', accent: '#4ade80' }, // East Blue green
  2:  { from: '#7c2d12', to: '#450a03', accent: '#fb923c' }, // Orange Town
  3:  { from: '#1e3a5f', to: '#0c1d33', accent: '#60a5fa' }, // Syrup Village
  4:  { from: '#1a3a4a', to: '#0a1e28', accent: '#38bdf8' }, // Baratie sea
  5:  { from: '#1e4a3a', to: '#0a2820', accent: '#34d399' }, // Arlong Park
  6:  { from: '#3a2a1a', to: '#1e150a', accent: '#fbbf24' }, // Loguetown
  7:  { from: '#1e2a4a', to: '#0a1228', accent: '#93c5fd' }, // Drum Island snow
  8:  { from: '#7c5a12', to: '#3d2d06', accent: '#fcd34d' }, // Alabasta sand
  9:  { from: '#1a3a5a', to: '#0a1e30', accent: '#7dd3fc' }, // Skypiea sky
  10: { from: '#1a1a3a', to: '#0a0a1e', accent: '#a78bfa' }, // Enies Lobby
  11: { from: '#1a0a2a', to: '#0a0514', accent: '#c084fc' }, // Thriller Bark
  12: { from: '#1a2a3a', to: '#0a1520', accent: '#38bdf8' }, // Sabaody
  13: { from: '#3a0a0a', to: '#1e0505', accent: '#f87171' }, // Marineford war
  14: { from: '#0a2a3a', to: '#051520', accent: '#22d3ee' }, // Fish-Man Island
  15: { from: '#3a1a1a', to: '#1e0a0a', accent: '#fb7185' }, // Dressrosa
  16: { from: '#2a0a3a', to: '#150520', accent: '#e879f9' }, // Whole Cake
  17: { from: '#1a0a0a', to: '#0a0505', accent: '#f87171' }, // Wano
  18: { from: '#0a0a0a', to: '#050505', accent: '#6b7280' }, // ???
}

interface VoyageHeaderProps {
  currentArc:          Arc | null
  arcProgress:         ArcProgress | null
  bossHpMax:           number
}

export function VoyageHeader({ currentArc, arcProgress, bossHpMax }: VoyageHeaderProps) {
  const arcNum    = currentArc?.arc_number ?? 1
  const isBoss    = arcProgress?.status === 'boss_active'
  const arcPct    = arcProgress && currentArc
    ? Math.min(100, (arcProgress.progress_xp / currentArc.xp_required) * 100)
    : 0
  const bossHpPct = bossHpMax > 0
    ? Math.round(((arcProgress?.boss_current_hp ?? 0) / bossHpMax) * 100)
    : 0
  const shipSrc   = arcNum <= 10 ? '/ships/going_merry.png' : '/ships/sunny.png'
  const colors    = ARC_COLORS[arcNum] ?? ARC_COLORS[1]
  const slug      = islandSlug(currentArc?.name ?? '')

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'clamp(170px, 44vw, 210px)' }}>

      {/* ---- BOSS MODE: fills entire header, no sea texture, no island card ---- */}
      {isBoss && currentArc?.boss_name && (
        <motion.div
          key={`boss-${arcNum}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <BossCard bossName={currentArc.boss_name} colors={colors} />

          {/* HP overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-heading text-[9px] uppercase tracking-widest text-wanted-300">⚔️ Boss Fight</p>
                <p className="font-heading text-sm font-bold text-white leading-tight">{currentArc.boss_name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-bold text-white leading-none">
                  {arcProgress?.boss_current_hp?.toLocaleString()}
                </p>
                <p className="font-heading text-[9px] uppercase text-wanted-400">HP</p>
              </div>
            </div>
            <div className="h-3 rounded-sm overflow-hidden border border-wanted-800"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <motion.div
                className="h-full"
                style={{ background: 'linear-gradient(to right, #be123c, #f43f5e)' }}
                animate={{ width: `${bossHpPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- SAILING MODE: sea texture + ship + island card ---- */}
      {!isBoss && (
        <div className="absolute inset-0 flex">
          {/* Sea texture side */}
          <div
            className="relative overflow-hidden flex-1"
            style={{
              backgroundImage: 'url(/images/sea_texture.jpg)',
              backgroundSize: 'auto 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: colors.from,
            }}
          >
            <SeaWaves color={colors.accent} />

            {/* Ship */}
            <motion.div
              className="absolute bottom-6"
              animate={{ left: `${6 + arcPct * 0.72}%` }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
              <BobbingShip src={shipSrc} />
            </motion.div>

            {/* Arc info */}
            <div className="absolute top-5 left-4">
              <h2 className="font-display text-xl leading-tight"
                style={{
                  color: '#f0ece0',
                  textShadow: '0 2px 10px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)',
                }}>
                {currentArc?.name ?? '—'}
              </h2>
              <p className="font-body text-sm italic"
                style={{
                  color: '#f0ece0',
                  textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.8)',
                }}>
                {currentArc?.location ?? ''}
              </p>
            </div>
          </div>

          {/* Island card */}
          <div className="shrink-0 h-full" style={{ width: 'clamp(90px, 22vw, 144px)' }}>
            <IslandCard arc={currentArc} slug={slug} colors={colors} />
          </div>
        </div>
      )}

    </div>
  )
}

// ---- Bobbing ship ----
function BobbingShip({ src }: { src: string }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <img
        src={src}
        alt="Ship"
        className="w-auto object-contain"
        style={{
          // ~18% of viewport width, capped at 96px on desktop, min 56px on tiny screens
          height: 'clamp(44px, 14vw, 80px)',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
          transform: 'scaleX(-1)',
        }}
      />
    </motion.div>
  )
}

// ---- Island destination card — filled rectangle ----
function IslandCard({
  arc,
  slug,
  colors,
}: {
  arc: Arc | null
  slug: string
  colors: { from: string; to: string; accent: string }
}) {
  const [loaded, setLoaded]   = useState(false)
  const [failed, setFailed]   = useState(false)
  const [src, setSrc]         = useState('')
  const imgRef                = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!slug) return
    setFailed(false)
    setLoaded(false)
    setSrc(`/islands/${slug}.jpg`)
  }, [slug])

  useEffect(() => {
    if (!slug || failed) return
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [slug, failed, src])

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Colour placeholder — always behind */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ background: `linear-gradient(160deg, ${colors.from}, ${colors.to})` }}
      >
        <div className="text-3xl mb-1 opacity-50">🏝️</div>
        <p className="font-heading text-[9px] uppercase tracking-wider text-center px-2 leading-tight opacity-60"
          style={{ color: colors.accent }}>
          {arc?.name ?? '—'}
        </p>
      </div>

      {/* Real image — fills rectangle, object-cover */}
      {!failed && src && (
        <img
          ref={imgRef}
          src={src}
          alt={arc?.name ?? ''}
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            // Try fallback chain: jpg → webp → png → give up
            if (src.endsWith('.jpg')) {
              setSrc(`/islands/${slug}.webp`)
            } else if (src.endsWith('.webp')) {
              setSrc(`/islands/${slug}.png`)
            } else {
              setFailed(true)
            }
          }}
        />
      )}

      {/* Left fade to blend with sea background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 35%)' }}
      />
    </div>
  )
}

// ---- Boss card ----
function BossCard({
  bossName,
  colors,
}: {
  bossName: string
  colors: { from: string; to: string; accent: string }
}) {
  const slug = bossName.toLowerCase().replace(/[^a-z0-9]+/g, '_')

  return (
    <div className="relative w-full h-full">
      {/* Try real boss image */}
      <img
        src={`/bosses/${slug}.png`}
        alt={bossName}
        className="absolute inset-0 w-full h-full object-cover object-top"
        style={{ opacity: 0.85 }}
        onError={e => {
          // try webp fallback
          const img = e.target as HTMLImageElement
          if (!img.src.endsWith('.webp')) {
            img.src = `/bosses/${slug}.webp`
          } else {
            img.style.display = 'none'
          }
        }}
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
      />

      {/* Placeholder */}
      <div
        className="absolute inset-0 flex items-center justify-center -z-10"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
      >
        <span className="text-6xl opacity-30">⚔️</span>
      </div>
    </div>
  )
}

// ---- Animated sea waves ----
function SeaWaves({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute h-px w-full"
          style={{
            top: `${45 + i * 18}%`,
            background: `linear-gradient(to right, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
          }}
          animate={{ x: ['-10%', '10%', '-10%'] }}
          transition={{
            duration: 4 + i * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  )
}