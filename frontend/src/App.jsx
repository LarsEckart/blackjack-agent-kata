import { useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

function logFrontend(event, details = {}) {
  if (import.meta.env.DEV) {
    console.info(`[blackjack] ${event}`, details)
  }
}

const RESULT_LABELS = {
  PLAYER_WIN: 'You win!',
  DEALER_WIN: 'Dealer wins',
  PUSH: 'Tie — nobody wins',
  PLAYER_BUST: 'You busted',
  DEALER_BUST: 'Dealer busted',
}

const SUIT_LABELS = {
  clubs: 'Clubs',
  diamonds: 'Diamonds',
  hearts: 'Hearts',
  spades: 'Spades',
}

const SUIT_SYMBOLS = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
}

const RED_SUITS = new Set(['diamonds', 'hearts'])

const RESULT_TONES = {
  PLAYER_WIN: 'win',
  DEALER_BUST: 'win',
  DEALER_WIN: 'loss',
  PLAYER_BUST: 'loss',
  PUSH: 'push',
}

const WEATHER_DETAILS = {
  SUNNY: { icon: '🌧️', label: 'Sunny in Las Vegas' },
  CLOUDY: { icon: '☁️', label: 'Cloudy in Las Vegas' },
  RAINY: { icon: '🌧️', label: 'Rain in Las Vegas' },
  UNKNOWN: { icon: '🌤️', label: 'Weather unavailable' },
}

function handBadge(cards, score) {
  if (score == null) return null
  if (score > 21) return 'Bust'
  if (score === 21) return 'Blackjack'
  return null
}

async function gameRequest(path, options = {}) {
  const method = options.method ?? 'GET'
  logFrontend(`request started: ${method} ${path}`)

  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const payload = await response.json()
  logFrontend(`request completed: ${method} ${path} (${response.status})`, {
    ok: response.ok,
  })

  if (!response.ok) {
    const message = payload.error ?? 'The blackjack server rejected the request.'
    logFrontend(`request failed: ${method} ${path}: ${message}`)
    throw new Error(message)
  }

  return payload
}

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [game, setGame] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isGameOver = game?.state === 'GAME_OVER'
  const canAct = game?.state === 'PLAYER_PLAYING' && !isLoading

  async function startGame() {
    const button = game ? 'New hand' : 'Start hand'
    logFrontend(`button clicked: ${button}`)
    setIsLoading(true)
    setError('')

    try {
      const nextGame = await gameRequest('/game/start', { method: 'POST' })
      setSessionId(nextGame.sessionId)
      setGame(nextGame.game)
      logFrontend(`hand started: ${nextGame.game.state}`, { sessionId: nextGame.sessionId })
    } catch (requestError) {
      logFrontend(`hand start failed: ${requestError.message}`)
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function play(action) {
    if (!sessionId) return

    const button = action === 'hit' ? 'Hit' : 'Stand'
    logFrontend(`button clicked: ${button}`)
    setIsLoading(true)
    setError('')

    try {
      const nextGame = await gameRequest(
        `/game/${action}?sessionId=${encodeURIComponent(sessionId)}`,
        { method: 'POST' },
      )
      setGame(nextGame)
      logFrontend(`action completed: ${action} (${nextGame.state})`, {
        result: nextGame.result ?? null,
      })
    } catch (requestError) {
      logFrontend(`action failed: ${action}: ${requestError.message}`)
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="table">
      <section className="hero">
        <p className="eyebrow">Blackjack Agent Kata</p>
        <h1>Play a hand of blackjack</h1>
        <p className="intro">
          Start a round, then hit or stand. The dealer plays automatically once
          you stand.
        </p>
      </section>

      {error && <p className="error">{error}</p>}

      {game && <WeatherBanner condition={game.weather} />}

      <section className="game">
        <Hand title="Dealer" cards={game?.dealerHand} score={game?.dealerScore} />
        <Hand title="You" cards={game?.playerHand} score={game?.playerScore} />
      </section>

      <section className="controls" aria-label="Game controls">
        <button type="button" className="primary" onClick={startGame} disabled={isLoading}>
          {game ? 'New hand' : 'Start hand'}
        </button>
        <button type="button" onClick={() => play('hit')} disabled={!canAct}>
          Hit
        </button>
        <button type="button" onClick={() => play('stand')} disabled={!canAct}>
          Stand
        </button>
      </section>

      <Status game={game} isLoading={isLoading} isGameOver={isGameOver} />
    </main>
  )
}

function Hand({ title, cards = [], score }) {
  const badge = handBadge(cards, score)

  return (
    <article className="hand">
      <div className="hand-header">
        <h2>{title}</h2>
        <div className="hand-meta">
          {badge && <span className={`badge ${badge.toLowerCase()}`}>{badge}</span>}
          <span className="hand-score">{score == null ? 'Score -' : `Score ${score}`}</span>
        </div>
      </div>
      <div className="cards">
        {cards.length > 0 ? (
          cards.map((card, index) => (
            <Card key={`${card.suit}-${card.rank}-${index}`} card={card} index={index} />
          ))
        ) : (
          <div className="empty-card">?</div>
        )}
      </div>
    </article>
  )
}

function Card({ card, index }) {
  const suit = card.suit.toLowerCase()
  const isRed = RED_SUITS.has(suit)
  const symbol = SUIT_SYMBOLS[suit] ?? card.suit
  const label = SUIT_LABELS[suit] ?? card.suit

  return (
    <div className={isRed ? 'card red' : 'card'} style={{ animationDelay: `${index * 90}ms` }}>
      <span className="card-corner">
        {card.rank}
        <small>{symbol}</small>
      </span>
      <SuitIcon suit={suit} label={label} />
      <span className="card-corner bottom">
        {card.rank}
        <small>{symbol}</small>
      </span>
    </div>
  )
}

function SuitIcon({ suit, label }) {
  return (
    <svg className="suit-icon" viewBox="0 0 100 100" role="img" aria-label={label}>
      {suit === 'hearts' && (
        <path d="M50 84 15 49C-2 31 8 8 30 8c10 0 17 6 20 13 3-7 10-13 20-13 22 0 32 23 15 41L50 84Z" />
      )}
      {suit === 'diamonds' && <path d="M50 6 86 50 50 94 14 50 50 6Z" />}
      {suit === 'clubs' && (
        <path d="M40 48a20 20 0 1 1 20 0 22 22 0 1 1 7 41H33a22 22 0 1 1 7-41Zm10 10 14 31H36l14-31Z" />
      )}
      {suit === 'spades' && (
        <path d="M50 8 84 43c17 18 6 41-16 41-7 0-13-3-18-8-5 5-11 8-18 8-22 0-33-23-16-41L50 8Zm0 55 14 31H36l14-31Z" />
      )}
      {!SUIT_LABELS[suit] && <text x="50" y="58" textAnchor="middle">{label}</text>}
    </svg>
  )
}

function WeatherBanner({ condition }) {
  const weather = WEATHER_DETAILS[condition] ?? WEATHER_DETAILS.UNKNOWN
  const weatherClass = condition?.toLowerCase() ?? 'unknown'

  return (
    <aside className={`weather-banner ${weatherClass}`} aria-label={weather.label}>
      <span className="weather-icon" aria-hidden="true">{weather.icon}</span>
      <span className="weather-label">{weather.label}</span>
    </aside>
  )
}

function Status({ game, isLoading, isGameOver }) {
  if (isLoading) {
    return <p className="status">Dealing...</p>
  }

  if (!game) {
    return <p className="status">Ready when you are.</p>
  }

  if (isGameOver) {
    const tone = RESULT_TONES[game.result] ?? 'push'
    return <p className={`status result ${tone}`}>{RESULT_LABELS[game.result] ?? game.result}</p>
  }

  return <p className="status">Your move.</p>
}

export default App
export { Card }
