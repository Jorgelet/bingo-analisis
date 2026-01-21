"use client";

import { useState, useRef, type ChangeEvent, useEffect } from "react";
import styles from "./page.module.css";
import {
  type Carton,
  type Idioma,
  binarySearchMark,
  checkWinnersGreedy,
} from "../utils/algorithms";
import {
  processInputData,
  generateRandomRounds,
  LIMITES,
} from "../utils/gameLogic";

const CARTONES_POR_PAGINA = 8;

export default function BingoPage() {
  const [cartones, setCartones] = useState<Carton[]>([]);
  const [palabraActual, setPalabraActual] = useState("");
  const [historialPalabras, setHistorialPalabras] = useState<string[]>([]);
  const [rondas, setRondas] = useState<Idioma[]>([]);
  const [rondaIndex, setRondaIndex] = useState(0);
  const [ganadores, setGanadores] = useState<Carton[]>([]);

  const [mensajeRonda, setMensajeRonda] = useState<string | null>(null);
  const [partidaTerminada, setPartidaTerminada] = useState(false);

  const [bancosPalabras, setBancosPalabras] = useState<
    Record<string, Set<string>>
  >({});
  const [bancosLoading, setBancosLoading] = useState(true);

  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorPalabra, setErrorPalabra] = useState<string | null>(null);

  const [erroresCarga, setErroresCarga] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"file" | "manual">("file");
  const [manualInputText, setManualInputText] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadBancos = async () => {
      const idiomas = ["SP", "EN", "PT", "DT"];
      const nuevosBancos: Record<string, Set<string>> = {};

      try {
        await Promise.all(
          idiomas.map(async (lang) => {
            const response = await fetch(`/banco_${lang}.txt`);
            if (response.ok) {
              const text = await response.text();
              const cleanText = text.replace(/[\[\]']/g, "");
              const words = cleanText.split(",").map((w) => w.trim());
              nuevosBancos[lang] = new Set(words);
            } else {
              nuevosBancos[lang] = new Set();
            }
          }),
        );
        setBancosPalabras(nuevosBancos);
      } catch {
        setBancosPalabras({});
      } finally {
        setBancosLoading(false);
      }
    };

    loadBancos();
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (bancosLoading) {
      alert("Espera a que los diccionarios carguen.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    setErroresCarga([]);

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const idsExistentes = new Set(cartones.map((c) => c.id));
      const { cartones: nuevosCartones, errores } = processInputData(
        text,
        bancosPalabras,
        idsExistentes,
      );

      setCartones((prev) => [...prev, ...nuevosCartones]);
      setErroresCarga(errores);
      setLoading(false);

      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsText(file);
  };

  const handleManualSubmit = () => {
    setManualError(null);
    if (bancosLoading) {
      setManualError("Espera a que los diccionarios carguen.");
      return;
    }

    if (!manualInputText.trim()) {
      setManualError("El texto no puede estar vacío.");
      return;
    }

    const idsExistentes = new Set(cartones.map((c) => c.id));
    const { cartones: nuevosCartones, errores } = processInputData(
      manualInputText,
      bancosPalabras,
      idsExistentes,
    );

    if (errores.length > 0) {
      setErroresCarga(errores);
      if (nuevosCartones.length === 0) {
        setManualError(
          "No se pudieron procesar cartones válidos. Revisa los errores.",
        );
        return;
      }
    } else {
      setErroresCarga([]);
    }

    setCartones((prev) => [...prev, ...nuevosCartones]);
    setManualInputText("");
  };

  const handleStartGame = () => {
    if (cartones.length === 0) return;

    const idiomasActivos = Array.from(new Set(cartones.map((c) => c.idioma)));

    if (idiomasActivos.length === 0) {
      alert(
        "Error: No se detectaron idiomas válidos en los cartones cargados.",
      );
      return;
    }

    const randomRounds = generateRandomRounds(idiomasActivos);
    setRondas(randomRounds);
    setRondaIndex(0);
    setJuegoIniciado(true);
    setHistorialPalabras([]);
    setGanadores([]);
    setErrorPalabra(null);
    setMensajeRonda(null);
    setPaginaActual(1);
    setPartidaTerminada(false);
  };

  const idiomaActual = !partidaTerminada ? rondas[rondaIndex] : null;
  const rondaBloqueada = ganadores.length > 0;

  const handleCantarPalabra = () => {
    if (!idiomaActual || rondaBloqueada) return;

    setErrorPalabra(null);
    setMensajeRonda(null);

    if (!palabraActual.trim()) return;

    const palabraNormalizada = palabraActual.trim();

    const bancoActual = bancosPalabras[idiomaActual];
    if (bancoActual && !bancoActual.has(palabraNormalizada)) {
      setErrorPalabra(
        `La palabra "${palabraNormalizada}" no existe en el diccionario oficial.`,
      );
      return;
    }

    const nuevosCartones = [...cartones];

    for (const carton of nuevosCartones) {
      if (carton.idioma === idiomaActual && !carton.yaGano) {
        binarySearchMark(carton, palabraNormalizada);
      }
    }

    const candidatosValidos = nuevosCartones.filter(
      (c) => c.idioma === idiomaActual && !c.yaGano,
    );

    const nuevosGanadores = checkWinnersGreedy(candidatosValidos);

    if (nuevosGanadores.length > 0) {
      const idsGanadores = new Set(nuevosGanadores.map((g) => g.id));
      for (const carton of nuevosCartones) {
        if (idsGanadores.has(carton.id)) {
          carton.yaGano = true;
        }
      }

      setGanadores(nuevosGanadores);
      setMensajeRonda(null);
    } else {
      setMensajeRonda("No hubo cartones ganadores en esta ronda.");
    }

    setCartones(nuevosCartones);
    setHistorialPalabras((prev) => [palabraNormalizada, ...prev]);
    setPalabraActual("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCantarPalabra();
    }
  };

  const avanzarRonda = () => {
    if (rondaIndex >= rondas.length - 1) {
      setPartidaTerminada(true);
      setMensajeRonda("¡Partida Completa! Todos los idiomas han sido jugados.");
      return;
    }

    setRondaIndex((prev) => prev + 1);
    setErrorPalabra(null);
    setMensajeRonda(null);
    setPalabraActual("");
    setHistorialPalabras([]);
    setGanadores([]);
  };

  const totalPaginas = Math.ceil(cartones.length / CARTONES_POR_PAGINA);
  const cartonesVisibles = cartones.slice(
    (paginaActual - 1) * CARTONES_POR_PAGINA,
    paginaActual * CARTONES_POR_PAGINA,
  );

  const cambiarPagina = (delta: number) => {
    setPaginaActual((prev) =>
      Math.max(1, Math.min(totalPaginas, prev + delta)),
    );
  };

  const siguienteIdioma = rondas[rondaIndex + 1];
  const esUltimaRonda = rondaIndex >= rondas.length - 1;

  const renderErrorItem = (error: string) => {
    const idMatch = error.match(/\(([A-Z]{2}\d+)\)/);
    if (idMatch && error.includes("Palabras no permitidas")) {
      const idioma = idMatch[1].substring(0, 2);
      return (
        <>
          {error}{" "}
          <a
            href={`/banco_${idioma}.txt`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.errorLink}
          >
            Ver banco de {idioma}
          </a>
        </>
      );
    }
    return error;
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Bingo_P</h1>
        <p>Sistema de Gestión de Bingo de Palabras Masivo</p>
        {!juegoIniciado && !bancosLoading && (
          <div className={styles.availableLanguages}>
            <span>Idiomas disponibles (máx. palabras):</span>
            {(["SP", "EN", "PT", "DT"] as const).map((lang) => (
              <span
                key={lang}
                className={`${styles.langChip} ${
                  bancosPalabras[lang]?.size > 0
                    ? styles.langActive
                    : styles.langInactive
                }`}
                title={`Máximo ${LIMITES[lang]} palabras por cartón`}
              >
                {lang}
                <span className={styles.langLimit}>máx {LIMITES[lang]}</span>
              </span>
            ))}
          </div>
        )}

        {juegoIniciado && rondas.length > 0 && (
          <div className={styles.roundsOrder}>
            <span>Orden de rondas:</span>
            {rondas.map((lang, idx) => (
              <span
                key={lang}
                className={`${styles.roundChip} ${
                  idx === rondaIndex && !partidaTerminada
                    ? styles.roundCurrent
                    : idx < rondaIndex || partidaTerminada
                      ? styles.roundCompleted
                      : styles.roundPending
                }`}
              >
                {idx + 1}. {lang}
              </span>
            ))}
          </div>
        )}
      </header>

      {!juegoIniciado ? (
        <section className={`${styles.card} ${styles.setupSection}`}>
          <h2>Configuración de Partida</h2>

          {bancosLoading && (
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Cargando diccionarios...
            </p>
          )}

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "file" ? styles.active : ""}`}
              onClick={() => setActiveTab("file")}
            >
              Carga Masiva
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "manual" ? styles.active : ""}`}
              onClick={() => setActiveTab("manual")}
            >
              Ingreso Manual
            </button>
          </div>

          <div style={{ width: "100%" }}>
            {activeTab === "file" ? (
              <>
                <label
                  htmlFor="fileInput"
                  className={styles.inputGroup}
                  style={{ marginBottom: "0.5rem" }}
                >
                  <span style={{ fontWeight: 600 }}>Cargar Archivo (.txt)</span>
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept=".txt"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                />
                {loading && <p>Procesando cartones...</p>}
              </>
            ) : (
              <div className={styles.manualForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="manualInput">
                    Datos de Jugadores y Cartones
                  </label>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Formato: J1 (nueva línea) SP123456 palabra1 palabra2...
                  </p>
                  <textarea
                    id="manualInput"
                    className={styles.textArea}
                    value={manualInputText}
                    onChange={(e) => setManualInputText(e.target.value)}
                    placeholder="J1&#10;SP100200 casa perro..."
                    style={{ minHeight: "150px" }}
                  />
                </div>
                {manualError && (
                  <p className={styles.errorMessage}>{manualError}</p>
                )}
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  className={styles.btnSecondary}
                  style={{ alignSelf: "flex-start" }}
                  disabled={bancosLoading}
                >
                  Procesar Datos
                </button>
              </div>
            )}

            {erroresCarga.length > 0 && (
              <div className={styles.uploadReport}>
                <div className={styles.uploadReportSummary}>
                  ⚠️ {erroresCarga.length} problemas encontrados:
                </div>
                <ul className={styles.uploadErrorList}>
                  {erroresCarga.map((err, idx) => (
                    <li
                      key={`${idx}-${err.substring(0, 10)}`}
                      className={styles.uploadErrorItem}
                    >
                      {renderErrorItem(err)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {cartones.length > 0 && (
              <p
                style={{
                  marginTop: "1rem",
                  color: "var(--accent-color)",
                  fontWeight: 500,
                }}
              >
                ✔ {cartones.length} cartones cargados en total.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartGame}
            disabled={cartones.length === 0 || bancosLoading}
            className={styles.btnPrimary}
            style={{ width: "100%", marginTop: "1rem" }}
          >
            {bancosLoading ? "Cargando recursos..." : "Iniciar Partida"}
          </button>
        </section>
      ) : (
        <section className={styles.gameSection}>
          {ganadores.length > 0 ? (
            <div className={styles.winnerAlert}>
              <h2>¡TENEMOS GANADORES! 🎉</h2>
              <div className={styles.winnerList}>
                {ganadores.map((g) => (
                  <div key={g.id} className={styles.winnerItem}>
                    <span style={{ fontWeight: "bold", display: "block" }}>
                      {g.jugador}
                    </span>
                    <span className={styles.winnerTag}>{g.id}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "2rem" }}>
                <button
                  type="button"
                  onClick={avanzarRonda}
                  className={styles.btnPrimary}
                  style={{ fontSize: "1.1rem", padding: "1rem 2rem" }}
                >
                  {esUltimaRonda
                    ? "Finalizar Partida"
                    : `Comenzar Ronda de ${siguienteIdioma} →`}
                </button>
              </div>
            </div>
          ) : (
            mensajeRonda && (
              <div className={styles.roundInfoMessage}>ℹ️ {mensajeRonda}</div>
            )
          )}

          {!partidaTerminada && (
            <div className={styles.card}>
              <div className={styles.roundInfo}>
                <div>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      marginRight: "0.5rem",
                    }}
                  >
                    Ronda Actual:
                  </span>
                  <span className={styles.languageBadge}>
                    Idioma {idiomaActual}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="wordInput"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Cantar Palabra
                </label>
                <div className={styles.playArea}>
                  <div className={styles.inputWrapper}>
                    <input
                      id="wordInput"
                      type="text"
                      value={palabraActual}
                      onChange={(e) => {
                        setPalabraActual(e.target.value);
                        if (errorPalabra) setErrorPalabra(null);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        rondaBloqueada
                          ? "Ronda finalizada"
                          : "Ingrese palabra..."
                      }
                      className={`${styles.wordInput} ${errorPalabra ? styles.error : ""}`}
                      disabled={rondaBloqueada}
                    />
                    {errorPalabra && (
                      <div className={styles.errorMessage}>
                        ⚠️ {errorPalabra}
                        <a
                          href={`/banco_${idiomaActual}.txt`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.errorLink}
                        >
                          Ver lista oficial de {idiomaActual}
                        </a>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCantarPalabra}
                    className={styles.callButton}
                    disabled={rondaBloqueada}
                  >
                    CANTAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {partidaTerminada && (
            <div
              className={styles.card}
              style={{ textAlign: "center", padding: "3rem" }}
            >
              <h2
                style={{ color: "var(--primary-color)", marginBottom: "1rem" }}
              >
                Partida Finalizada
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginBottom: "2rem",
                }}
              >
                No hay más rondas de idiomas disponibles.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => window.location.reload()}
                style={{ maxWidth: "200px" }}
              >
                Nueva Partida
              </button>
            </div>
          )}

          <div className={styles.card}>
            <h3>Estadísticas en Tiempo Real</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Cartones</span>
                <span className={styles.statValue}>{cartones.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>
                  Cartones en Juego ({idiomaActual || "-"})
                </span>
                <span className={styles.statValue}>
                  {idiomaActual
                    ? cartones.filter((c) => c.idioma === idiomaActual).length
                    : 0}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Última Palabra</span>
                <span
                  className={styles.statValue}
                  style={{ color: "var(--primary-color)" }}
                >
                  {historialPalabras[0] || "-"}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Cantadas</span>
                <span className={styles.statValue}>
                  {historialPalabras.length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.cardsContainer}>
            <h3>Cartones en Juego (Vista Detallada)</h3>

            <div className={styles.cardsGrid}>
              {cartonesVisibles.map((carton) => (
                <div key={carton.id} className={styles.cartonCard}>
                  <div className={styles.cartonHeader}>
                    <div>
                      <span className={styles.jugadorName}>
                        {carton.jugador}
                      </span>
                      <span className={styles.separator}> | </span>
                      <span className={styles.cartonId}>{carton.id}</span>
                    </div>
                    <span className={styles.cartonProgress}>
                      {carton.totalAciertos} / {carton.limitePalabras}
                    </span>
                  </div>
                  <div className={styles.wordsGrid}>
                    {carton.palabras.map((palabra, idx) => (
                      <span
                        key={`${carton.id}-${palabra}`}
                        className={`${styles.wordItem} ${
                          carton.marcadas[idx]
                            ? styles.wordMarked
                            : styles.wordPending
                        }`}
                      >
                        {palabra}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => cambiarPagina(-1)}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>
                <span className={styles.pageIndicator}>
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => cambiarPagina(1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
