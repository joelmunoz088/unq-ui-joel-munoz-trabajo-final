import { useState, useEffect, useRef, type FormEvent } from 'react';
import { validateWordInDictionary } from './services/wordService';
import {
  validateChainLocally,
  getRequiredStartingLetter,
} from './utils/wordRules';
import {
  getLeaderboard,
  saveScoreToLeaderboard,
  type LeaderboardEntry,
} from './utils/leaderboard';
import './App.css';

const TURN_SECONDS = 15;

export function App() {
  const [words, setWords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(TURN_SECONDS);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    getLeaderboard()
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const gameOverRef = useRef(false);
  const scoreSavedRef = useRef(false);

  const score = words.reduce((acc, word) => acc + word.length, 0);
  const requiredLetter =
    words.length > 0 ? getRequiredStartingLetter(words[words.length - 1]) : null;
  const isDangerTime = isGameStarted && timeLeft <= 5 && !isGameOver;

  const triggerError = (message: string) => {
    setErrorMsg(message);
    setShakeKey((prev) => prev + 1);
  };

  // Control del temporizador de 15 segundos
  useEffect(() => {
    if (!isGameStarted || isGameOver) return;

    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          gameOverRef.current = true;
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isGameStarted, isGameOver, words.length]);

  // Guardar puntaje en el Top 10 al finalizar la partida
  useEffect(() => {
    if (isGameOver && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      if (score > 0) {
        const updated = saveScoreToLeaderboard(score, words.length);
        setLeaderboard(updated);
      }
    }
  }, [isGameOver, score, words.length]);

  // Mantener foco en el input mientras se juega
  useEffect(() => {
    if (!isGameOver && !isValidating) {
      inputRef.current?.focus();
    }
  }, [isGameOver, isValidating, words]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isGameOver || isValidating) return;

    setErrorMsg(null);

    const localCheck = validateChainLocally(inputValue, words);
    if (!localCheck.valid) {
      triggerError(localCheck.error || 'Palabra inválida.');
      return;
    }

    const candidate = localCheck.cleanWord;

    setIsValidating(true);
    try {
      const exists = await validateWordInDictionary(candidate);

      if (gameOverRef.current) return;

      if (!exists) {
        triggerError('La palabra no existe.');
        return;
      }

      setWords((prev) => [...prev, candidate]);
      setInputValue('');
      setTimeLeft(TURN_SECONDS);
      if (!isGameStarted) {
        setIsGameStarted(true);
      }
    } catch (err: unknown) {
      if (!gameOverRef.current) {
        triggerError(
          err instanceof Error
            ? err.message
            : 'No se pudo validar la palabra.'
        );
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleRestart = () => {
    gameOverRef.current = false;
    scoreSavedRef.current = false;
    setWords([]);
    setInputValue('');
    setTimeLeft(TURN_SECONDS);
    setIsGameStarted(false);
    setIsGameOver(false);
    setIsValidating(false);
    setErrorMsg(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <header className="game-header">
          <h1 className="game-title">PALABRAS ENCADENADAS</h1>
          <p className="subtitle">
            ¡Formá la cadena más larga antes de que suene el cronómetro!
          </p>
        </header>

        <div className="playful-grid">
          {/* Columna izquierda: Cronómetro + Puntaje */}
          <aside className="side-stats">
            <div
              className={`playful-card stopwatch-card ${
                isDangerTime ? 'stopwatch-danger' : ''
              }`}
            >
              <div className="stopwatch-icon-wrap" aria-hidden="true">
                <svg
                  viewBox="0 0 64 64"
                  className="stopwatch-svg"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="26"
                    y="4"
                    width="12"
                    height="6"
                    rx="3"
                    fill="#fb923c"
                    stroke="#1e293b"
                    strokeWidth="3"
                  />
                  <line
                    x1="32"
                    y1="10"
                    x2="32"
                    y2="15"
                    stroke="#1e293b"
                    strokeWidth="3"
                  />
                  <line
                    x1="47"
                    y1="16"
                    x2="51"
                    y2="12"
                    stroke="#1e293b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="32"
                    cy="36"
                    r="22"
                    fill="#fde047"
                    stroke="#1e293b"
                    strokeWidth="3.5"
                  />
                  <circle cx="32" cy="36" r="16" fill="#ffffff" />
                  <path
                    d="M32 24V36L40 40"
                    stroke="#ef4444"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="32" cy="36" r="3" fill="#1e293b" />
                </svg>
              </div>

              <span className="card-kicker">CRONÓMETRO</span>
              <div className="stopwatch-time">{timeLeft}s</div>
              <div className="timer-bar-bg">
                <div
                  className="timer-bar-fill"
                  style={{ width: `${(timeLeft / TURN_SECONDS) * 100}%` }}
                />
              </div>
              <span className="card-hint">
                {!isGameStarted
                  ? 'Arranca con tu 1ª palabra'
                  : isGameOver
                  ? '¡Tiempo agotado!'
                  : 'Se reinicia al acertar'}
              </span>
            </div>

            <div className="mini-stats-row">
              <div className="playful-card score-card">
                <span className="card-kicker">PUNTAJE</span>
                <strong className="big-number score-color">{score}</strong>
                <span className="card-hint">1 pt / letra</span>
              </div>

              <div className="playful-card count-card">
                <span className="card-kicker">CADENA</span>
                <strong className="big-number count-color">{words.length}</strong>
                <span className="card-hint">
                  {words.length === 1 ? 'palabra' : 'palabras'}
                </span>
              </div>
            </div>
          </aside>

          {/* Columna central: Zona de juego y Cadena */}
          <main className="center-stage">
            {isGameOver ? (
              <section className="playful-card gameover-card">
                <span className="pill-badge badge-red">PARTIDA FINALIZADA</span>
                <h2>¡Se acabó el tiempo!</h2>
                <div className="gameover-metrics">
                  <div className="metric-box">
                    <span>Puntaje final</span>
                    <strong>{score} pts</strong>
                  </div>
                  <div className="metric-box">
                    <span>Palabras encadenadas</span>
                    <strong>{words.length}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-3d btn-cyan"
                  onClick={handleRestart}
                >
                  ¡JUGAR DE NUEVO!
                </button>
              </section>
            ) : (
              <section
                key={shakeKey}
                className={`playful-card input-card ${
                  errorMsg ? 'shake-anim' : ''
                }`}
              >
                <div className="prompt-banner">
                  {requiredLetter ? (
                    <>
                      <span>Tu palabra debe empezar con:</span>
                      <span className="target-letter-tile">
                        {requiredLetter.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <span>¡Escribí cualquier palabra válida para empezar!</span>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="playful-form">
                  <input
                    ref={inputRef}
                    type="text"
                    className={`playful-input ${errorMsg ? 'has-error' : ''}`}
                    placeholder={
                      requiredLetter
                        ? `Palabra con "${requiredLetter.toUpperCase()}"...`
                        : 'Ej: casa...'
                    }
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    disabled={isValidating}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className="btn-3d btn-cyan"
                    disabled={isValidating || !inputValue.trim()}
                  >
                    {isValidating ? 'VALIDANDO...' : '¡ENVIAR!'}
                  </button>
                </form>

                {errorMsg && (
                  <div className="playful-error" role="alert">
                    {errorMsg}
                  </div>
                )}
              </section>
            )}

            <section className="playful-card chain-card">
              <div className="section-header">
                <h2>Cadenas</h2>
                <span className="pill-badge badge-amber">
                  {words.length} {words.length === 1 ? 'palabra' : 'palabras'}
                </span>
              </div>

              {words.length === 0 ? (
                <div className="empty-state">
                  Todavía no hay palabras en la cadena. ¡Animate con la primera!
                </div>
              ) : (
                <div className="chips-flow">
                  {words.map((word, index) => {
                    const colorClass = `chip-color-${index % 4}`;
                    return (
                      <div key={`${word}-${index}`} className="chip-step">
                        <span className={`playful-chip ${colorClass}`}>
                          <span className="chip-word">{word}</span>
                          <span className="chip-pts">+{word.length}</span>
                        </span>
                        {index < words.length - 1 && (
                          <span className="flow-arrow" aria-hidden="true">
                            ➜
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>

          {/* Columna derecha: Leaderboard Top 10 */}
          <aside className="playful-card leaderboard-card">
            <div className="section-header">
              <h2>LEADERBOARD</h2>
              <span className="pill-badge badge-blue">TOP 10</span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="empty-state">
                Terminá una partida para guardar tu récord acá.
              </div>
            ) : (
              <ol className="playful-ranking">
                {leaderboard.map((entry, idx) => (
                  <li key={entry.id} className="ranking-row">
                    <span className={`rank-medal medal-${idx + 1}`}>
                      {idx + 1}
                    </span>
                    <div className="ranking-details">
                      <strong>{entry.wordsCount} palabras</strong>
                      <small>{entry.date}</small>
                    </div>
                    <span className="ranking-score">{entry.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;