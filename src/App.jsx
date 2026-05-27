import { useRef, useState, useCallback } from 'react'
import { useGameEngine } from './useGameEngine'

// ── Overlay screens ──────────────────────────────────────────────────────────

function MenuScreen({ onTap }) {
  return (
    <div
      onClick={onTap}
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: 'rgba(6,6,16,0.88)', backdropFilter: 'blur(6px)', cursor: 'pointer' }}
    >
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(52px, 15vw, 80px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-4px',
          lineHeight: 1,
        }}
      >
        ORBIT
      </p>

      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '4px',
          marginTop: 10,
          textTransform: 'uppercase',
        }}
      >
        Tap to survive
      </p>

      <div
        className="animate-pulse-slow"
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '3px',
          marginTop: 52,
        }}
      >
        — TAP ANYWHERE TO START —
      </div>

      {/* How to play */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {[
          ['TAP', 'reverse direction + shift orbit'],
          ['THREAD', 'pass through the ring gaps'],
          ['SURVIVE', 'as long as you can'],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: 'flex',
              gap: 12,
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#7ab4ff', letterSpacing: 2 }}>{k}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeadScreen({ score, best, onTap }) {
  const isNewBest = score > 0 && score === best
  return (
    <div
      onClick={onTap}
      className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in"
      style={{ background: 'rgba(6,6,16,0.9)', backdropFilter: 'blur(6px)', cursor: 'pointer' }}
    >
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        Score
      </p>

      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(64px, 20vw, 100px)',
          fontWeight: 800,
          color: '#7ab4ff',
          letterSpacing: '-4px',
          lineHeight: 1,
          marginTop: 6,
        }}
      >
        {score}
      </p>

      {isNewBest ? (
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: '#ffd97a',
            letterSpacing: 3,
            marginTop: 10,
          }}
        >
          ★ NEW BEST ★
        </p>
      ) : (
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 3,
            marginTop: 10,
          }}
        >
          BEST: {best}
        </p>
      )}

      <div
        className="animate-pulse-slow"
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 3,
          marginTop: 52,
        }}
      >
        — TAP TO RETRY —
      </div>
    </div>
  )
}

// ── HUD (in-game score) ───────────────────────────────────────────────────────

function HUD({ score, best }) {
  return (
    <div className="absolute top-0 left-0 w-full flex flex-col items-center pointer-events-none" style={{ paddingTop: 36 }}>
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(44px, 13vw, 64px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-2px',
          lineHeight: 1,
          textShadow: '0 0 30px rgba(120,180,255,0.5)',
        }}
      >
        {score}
      </p>
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: 3,
          marginTop: 4,
        }}
      >
        BEST: {best}
      </p>
    </div>
  )
}

// ── Combo pop ─────────────────────────────────────────────────────────────────

function ComboPop({ combo }) {
  if (!combo || combo < 3) return null
  return (
    <div
      key={combo}
      className="animate-pop"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        fontFamily: "'Syne', sans-serif",
        fontSize: 'clamp(26px, 8vw, 36px)',
        fontWeight: 800,
        color: '#ffd97a',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        textShadow: '0 0 20px rgba(255,217,122,0.6)',
      }}
    >
      ×{combo} COMBO!
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const canvasRef   = useRef(null)
  const [gameState, setGameState] = useState('menu')  // menu | play | dead
  const [score, setScore]         = useState(0)
  const [best, setBest]           = useState(0)
  const [combo, setCombo]         = useState(null)
  const comboTimerRef             = useRef(null)

  const handleScore = useCallback((newScore, comboCount) => {
    setScore(newScore)
    if (comboCount) {
      setCombo(comboCount)
      clearTimeout(comboTimerRef.current)
      comboTimerRef.current = setTimeout(() => setCombo(null), 750)
    }
  }, [])

  const handleDie = useCallback(() => {}, [])

  const handleStateChange = useCallback((newState, finalScore) => {
    setGameState(newState)
    if (newState === 'dead') {
      setScore(finalScore)
      setBest(prev => Math.max(prev, finalScore))
    }
    if (newState === 'play') {
      setScore(0)
      setCombo(null)
    }
  }, [])

  const { handleTap } = useGameEngine(canvasRef, handleScore, handleDie, handleStateChange)

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#060610' }}>
      {/* Game canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* In-game HUD */}
      {gameState === 'play' && <HUD score={score} best={best} />}

      {/* Combo burst */}
      {gameState === 'play' && <ComboPop combo={combo} />}

      {/* Overlay screens */}
      {gameState === 'menu' && <MenuScreen onTap={handleTap} />}
      {gameState === 'dead' && <DeadScreen score={score} best={best} onTap={handleTap} />}
    </div>
  )
}
