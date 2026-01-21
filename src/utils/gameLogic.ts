import { type Carton, type Idioma, mergeSort } from "./algorithms";

/** Maximum words allowed per language */
export const LIMITES: Record<Idioma, number> = {
  SP: 24,
  EN: 14,
  PT: 20,
  DT: 10,
};

interface ParseResult {
  cartones: Carton[];
  errores: string[];
}

/**
 * Parses a text block (from file or manual input) into Carton objects.
 * Implements hierarchical parsing: Player -> Cards.
 * Validates words against the provided word banks.
 * @param text - Raw text input with player/card data
 * @param bancosPalabras - Word banks per language for validation
 * @returns Object containing valid cards and error messages
 */
export function processInputData(
  text: string,
  bancosPalabras: Record<string, Set<string>>,
): ParseResult {
  const lines = text.split(/\r?\n/);
  const cartones: Carton[] = [];
  const errores: string[] = [];

  let jugadorActual = "";
  let lineNumber = 0;

  for (const rawLine of lines) {
    lineNumber++;
    const line = rawLine.trim();
    if (!line) continue;

    if (
      line.startsWith("J") &&
      line.length > 1 &&
      line.length < 10 &&
      !line.includes(" ")
    ) {
      jugadorActual = line;
      continue;
    }

    if (!jugadorActual) {
      errores.push(
        `Línea ${lineNumber}: Se encontró un cartón sin jugador asignado (falta Jx antes).`,
      );
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }

    const id = parts[0];
    if (id.length < 3) {
      errores.push(`Línea ${lineNumber}: ID inválido '${id}'.`);
      continue;
    }

    const idiomaCode = id.substring(0, 2);
    if (
      idiomaCode !== "SP" &&
      idiomaCode !== "EN" &&
      idiomaCode !== "PT" &&
      idiomaCode !== "DT"
    ) {
      errores.push(`Línea ${lineNumber}: Idioma desconocido en ID '${id}'.`);
      continue;
    }

    const idioma = idiomaCode as Idioma;
    const palabrasRaw = parts.slice(1);
    const maxPermitido = LIMITES[idioma];

    if (palabrasRaw.length > maxPermitido) {
      errores.push(
        `Línea ${lineNumber} (${id}): Excede límite de ${maxPermitido} palabras.`,
      );
      continue;
    }

    const banco = bancosPalabras[idioma];
    if (!banco || banco.size === 0) {
      errores.push(
        `Línea ${lineNumber}: Banco de palabras no cargado para ${idioma}.`,
      );
      continue;
    }

    const palabrasInvalidas = palabrasRaw.filter((p) => !banco.has(p));
    if (palabrasInvalidas.length > 0) {
      errores.push(
        `Línea ${lineNumber} (${id}): Palabras no permitidas [${palabrasInvalidas.join(", ")}]`,
      );
      continue;
    }

    const palabrasOrdenadas = mergeSort(palabrasRaw);

    cartones.push({
      id,
      jugador: jugadorActual,
      idioma,
      palabras: palabrasOrdenadas,
      marcadas: new Array(palabrasOrdenadas.length).fill(false),
      totalAciertos: 0,
      limitePalabras: palabrasOrdenadas.length,
    });
  }

  return { cartones, errores };
}

/**
 * Generates a random order for game rounds using Fisher-Yates shuffle.
 * @param idiomasDisponibles - Array of languages to shuffle
 * @returns Shuffled array of languages
 */
export function generateRandomRounds(idiomasDisponibles: Idioma[]): Idioma[] {
  const idiomas = [...idiomasDisponibles];

  for (let i = idiomas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idiomas[i], idiomas[j]] = [idiomas[j], idiomas[i]];
  }
  return idiomas;
}
