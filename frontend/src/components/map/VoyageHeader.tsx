import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: 240,
        backgroundImage: 'url(/images/sea_texture.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: colors.from, // fallback while texture loads
      }}
    >
      {/* Animated sea waves background */}
      <SeaWaves color={colors.accent} />

      <AnimatePresence mode="wait">

        {/* ---- SAILING VIEW ---- */}
        {!isBoss && (
          <motion.div
            key={`sailing-${arcNum}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* Island PNG — right side, transparent, no box, blends naturally */}
            <div className="absolute right-0 top-0 bottom-0 w-64" style={{ height: 240 }}>
              <IslandCard arc={currentArc} slug={slug} colors={colors} />
            </div>

            {/* Ship — flipped, bigger, sails toward island */}
            <motion.div
              className="absolute bottom-10"
              animate={{ left: `${6 + arcPct * 0.48}%` }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
              <BobbingShip src={shipSrc} />
            </motion.div>

            {/* Arc info — top left */}
            <div className="absolute top-4 left-4">
              <p className="font-heading text-[10px] uppercase tracking-widest opacity-60 text-white">
                Current Arc
              </p>
              <h2 className="font-display text-lg text-white leading-tight drop-shadow">
                {currentArc?.name ?? '—'}
              </h2>
              <p className="font-body text-xs italic opacity-60 text-white mt-0.5">
                {currentArc?.location ?? ''}
              </p>
            </div>

            {/* Progress bar — bottom left */}
            <div className="absolute bottom-3 left-4">
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: colors.accent }}
                    animate={{ width: `${arcPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="font-mono text-xs text-white/70">{Math.round(arcPct)}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---- BOSS VIEW ---- */}
        {isBoss && currentArc?.boss_name && (
          <motion.div
            key={`boss-${arcNum}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Boss image or placeholder */}
            <BossCard
              bossName={currentArc.boss_name}
              colors={colors}
            />

            {/* HP bar */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="font-heading text-[9px] uppercase tracking-widest text-wanted-300">
                    ⚔️ Boss Fight
                  </p>
                  <p className="font-heading text-sm font-bold text-white leading-tight">
                    {currentArc.boss_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-white leading-none">
                    {arcProgress?.boss_current_hp?.toLocaleString()}
                  </p>
                  <p className="font-heading text-[9px] uppercase tracking-wide text-wanted-400">HP</p>
                </div>
              </div>

              {/* HP bar */}
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

      </AnimatePresence>
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
          height: 'clamp(56px, 18vw, 96px)',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
          transform: 'scaleX(-1)',
        }}
      />
    </motion.div>
  )
}

// ---- Island destination card ----
function IslandCard({
  arc,
  slug,
  colors,
}: {
  arc: Arc | null
  slug: string
  colors: { from: string; to: string; accent: string }
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!slug) return
    // Reset on slug change so a new arc always tries to load
    setFailed(false)
    setLoaded(false)
  }, [slug])

  useEffect(() => {
    if (!slug) return
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [slug, failed])

  return (
    <div className="relative w-full flex items-end justify-end" style={{ height: 240 }}>
      {/* Real PNG — transparent, blends naturally with background */}
      {!failed && slug ? (
        <img
          ref={imgRef}
          src={`/islands/${slug}.png`}
          alt={arc?.name ?? ''}
          className="h-full w-auto object-contain object-bottom transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        /* Fallback placeholder when no PNG available */
        <div className="flex flex-col items-center justify-center w-full h-full pb-6 opacity-40">
          <div className="text-4xl mb-1">🏝️</div>
          <p className="font-heading text-[9px] uppercase tracking-wider text-center px-2 leading-tight"
            style={{ color: colors.accent }}>
            {arc?.name ?? '—'}
          </p>
        </div>
      )}
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