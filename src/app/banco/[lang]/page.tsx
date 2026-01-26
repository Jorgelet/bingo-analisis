/** biome-ignore-all lint/suspicious/noArrayIndexKey: we need to use the index as the key */
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "../../page.module.css";

const API_BASE_URL = "http://localhost:8000/api";

type Idioma = "SP" | "EN" | "PT" | "DT";

const IDIOMA_NAMES: Record<Idioma, string> = {
  SP: "Español",
  EN: "English",
  PT: "Português",
  DT: "Dutch",
};

export default function BancoPage() {
  const params = useParams();
  const lang = (params.lang as string)?.toUpperCase() as Idioma;
  const [palabras, setPalabras] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBanco = async () => {
      if (!lang || !["SP", "EN", "PT", "DT"].includes(lang)) {
        setError("Idioma no válido");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/word-banks`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const banco = data.bancos[lang];

        if (!banco || banco.length === 0) {
          setError(`No se encontró banco de palabras para ${lang}`);
        } else {
          setPalabras(banco.sort());
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar el banco de palabras",
        );
      } finally {
        setLoading(false);
      }
    };

    loadBanco();
  }, [lang]);

  if (loading) {
    return (
      <main className={styles.container}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p>Cargando banco de palabras...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.container}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>Error</h2>
          <p>{error}</p>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              color: "var(--primary-color)",
            }}
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Banco de Palabras - {IDIOMA_NAMES[lang] || lang}</h1>
        <p>
          Total de palabras: <strong>{palabras.length}</strong>
        </p>
      </header>

      <section className={styles.card}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.75rem",
            padding: "1rem",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {palabras.map((palabra, idx) => (
            <span
              key={`${palabra}-${idx}`}
              style={{
                padding: "0.5rem",
                background: "var(--card-background)",
                border: "1px solid var(--border-color)",
                borderRadius: "0.25rem",
                fontSize: "0.9rem",
              }}
            >
              {palabra}
            </span>
          ))}
        </div>
      </section>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <a
          href="/"
          style={{
            color: "var(--primary-color)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          ← Volver al juego
        </a>
      </div>
    </main>
  );
}
