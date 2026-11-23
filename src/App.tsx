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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    getLeaderboard()
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const gameOverRef = useRef(false);
  const scoreSavedRef = useRef(false);

  const score = words.reduce((acc, word) => acc + word.length, 0);
  const requiredLetter =
    words.length > 0 ? getRequiredStartingLetter(words[words.length - 1]) : null;

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
  }, [isGameStarted, isGameOver]);

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
      setErrorMsg(localCheck.error || 'Palabra inválida.');
      return;
    }

    const candidate = localCheck.cleanWord;

    setIsValidating(true);
    try {
      const exists = await validateWordInDictionary(candidate);

      if (gameOverRef.current) return;

      if (!exists) {
        setErrorMsg('La palabra no existe.');
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
        setErrorMsg(
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
    <div className="app-container">
      <header className="game-header">
        <h1>Palabras Encadenadas</h1>
        <p className="subtitle">
          Encadená palabras en español antes de que el reloj llegue a 0
        </p>
      </header>

      <div className="layout-grid">
        <main className="game-board">
          {/* Panel superior: Tiempo, Puntaje y Palabras */}
          <section className="stats-bar">
            <div
              className={`stat-card timer-card ${
                isGameStarted && timeLeft <= 5 && !isGameOver ? 'timer-danger' : ''
              }`}
            >
              <span className="stat-label">Tiempo restante</span>
              <span className="stat-value">{timeLeft}s</span>
              <span className="stat-hint">
                {!isGameStarted
                  ? 'Arranca con tu 1ª palabra'
                  : isGameOver
                  ? 'Tiempo agotado'
                  : 'Se reinicia al acertar'}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Puntaje</span>
              <span className="stat-value">{score}</span>
              <span className="stat-hint">1 pt por letra</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Palabras</span>
              <span className="stat-value">{words.length}</span>
              <span className="stat-hint">Encadenadas</span>
            </div>
          </section>

          {/* Zona activa de juego o Pantalla de Fin de Partida */}
          {isGameOver ? (
            <section className="gameover-card">
              <div className="gameover-badge">Partida Finalizada</div>
              <h2>¡Se acabó el tiempo!</h2>
              <div className="gameover-summary">
                <div className="summary-item">
                  <span>Puntaje final</span>
                  <strong>{score} puntos</strong>
                </div>
                <div className="summary-item">
                  <span>Palabras encadenadas</span>
                  <strong>{words.length}</strong>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary btn-restart"
                onClick={handleRestart}
              >
                Jugar de nuevo
              </button>
            </section>
          ) : (
            <section className="input-section">
              <div className="next-letter-banner">
                {requiredLetter ? (
                  <>
                    Tu palabra debe empezar con la letra:{' '}
                    <strong className="letter-badge">
                      {requiredLetter.toUpperCase()}
                    </strong>
                  </>
                ) : (
                  <>Ingresá cualquier palabra válida en español para comenzar</>
                )}
              </div>

              <form onSubmit={handleSubmit} className="word-form">
                <input
                  ref={inputRef}
                  type="text"
                  className={`word-input ${errorMsg ? 'input-error' : ''}`}
                  placeholder={
                    requiredLetter
                      ? `Escribí una palabra con "${requiredLetter.toUpperCase()}"...`
                      : 'Escribí la primera palabra...'
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
                  className="btn-primary"
                  disabled={isValidating || !inputValue.trim()}
                >
                  {isValidating ? 'Validando...' : 'Enviar'}
                </button>
              </form>

              {errorMsg && (
                <div className="error-banner" role="alert">
                  {errorMsg}
                </div>
              )}
            </section>
          )}

          {/* Cadena de palabras válidas */}
          <section className="chain-section">
            <h2>Cadena de palabras ({words.length})</h2>
            {words.length === 0 ? (
              <p className="chain-empty">
                Todavía no ingresaste palabras. ¡Escribí la primera arriba!
              </p>
            ) : (
              <div className="chain-list">
                {words.map((word, index) => (
                  <div key={`${word}-${index}`} className="chain-item-wrapper">
                    <span className="word-chip">
                      {word}
                      <small className="word-points">+{word.length}</small>
                    </span>
                    {index < words.length - 1 && (
                      <span className="chain-arrow">→</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Panel lateral / inferior: Top 10 Mejores Puntajes */}
        <aside className="leaderboard-card">
          <h2>Top 10 Mejores Puntajes</h2>
          {leaderboard.length === 0 ? (
            <p className="leaderboard-empty">
              Completá una partida para registrar tu récord acá.
            </p>
          ) : (
            <ol className="leaderboard-list">
              {leaderboard.map((entry, idx) => (
                <li key={entry.id} className="leaderboard-item">
                  <span className={`rank-badge rank-${idx + 1}`}>
                    #{idx + 1}
                  </span>
                  <div className="rank-info">
                    <strong>{entry.score} pts</strong>
                    <small>
                      {entry.wordsCount}{' '}
                      {entry.wordsCount === 1 ? 'palabra' : 'palabras'} •{' '}
                      {entry.date}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;