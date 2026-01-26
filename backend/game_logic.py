"""
Proyecto Final - Bingo de Palabras
Algoritmos y Estructuras de Datos

Autores:
    - Jorge del Campo

Referencias:
    - Fisher-Yates Shuffle: Knuth, D. E. "The Art of Computer Programming",
      Volume 2: Seminumerical Algorithms, 3rd Edition, Addison-Wesley, 1997.
      También conocido como "Knuth Shuffle". Sección 3.4.2.

    - Parsing jerárquico: Diseño propio para procesar estructura
      Jugador -> Cartones del formato de entrada.

Modificaciones realizadas:
    - generate_random_rounds (líneas 163-185): Implementación estándar del
      algoritmo Fisher-Yates sin modificaciones respecto a la versión clásica.

    - process_input_data (líneas 40-160): Implementación original que combina:
      * Parsing línea por línea con detección de contexto (jugador actual)
      * Validación de formato de ID (prefijo idioma + 6 dígitos)
      * Validación contra bancos de palabras
      * Integración con merge_sort para ordenar palabras de cada cartón
"""

import random
import re
from models import Carton, Idioma
from algorithms import merge_sort


# Límites máximos de palabras por idioma
LIMITES: dict[Idioma, int] = {
    "SP": 24,
    "EN": 14,
    "PT": 20,
    "DT": 10,
}


def process_input_data(
    text: str, word_banks: dict[str, set[str]], existing_ids: set[str] | None = None
) -> tuple[list[Carton], list[str]]:
    """
    Procesa texto de entrada y extrae cartones de bingo validados.

    Implementa parsing jerárquico:
    1. Detecta líneas de jugador (formato: J1, J2, etc.)
    2. Asocia cartones subsecuentes al jugador actual
    3. Valida formato de ID, límites de palabras y existencia en banco

    Args:
        text: Texto con formato de entrada (jugadores y cartones)
        word_banks: Diccionario con bancos de palabras por idioma
        existing_ids: Set de IDs ya existentes para evitar duplicados

    Returns:
        Tupla con (lista de cartones válidos, lista de errores encontrados)

    Formato de entrada esperado:
        J1
        SP123456 palabra1 palabra2 palabra3 ...
        SP123457 palabra4 palabra5 ...
        J2
        EN234567 word1 word2 ...
    """
    if existing_ids is None:
        existing_ids = set()

    lines = text.split("\n")
    cartones: list[Carton] = []
    errores: list[str] = []
    ids_in_current_load: set[str] = set()

    current_player = ""
    line_number = 0

    for raw_line in lines:
        line_number += 1
        line = raw_line.strip()

        # Saltar líneas vacías
        if not line:
            continue

        # Detectar línea de jugador (J1, J2, etc.)
        if (
            line.startswith("J")
            and len(line) > 1
            and len(line) < 10
            and " " not in line
        ):
            current_player = line
            continue

        # Verificar que hay un jugador asignado
        if not current_player:
            errores.append(
                f"Línea {line_number}: Se encontró un cartón sin jugador asignado "
                "(falta Jx antes)."
            )
            continue

        # Parsear partes de la línea
        parts = line.split()
        if len(parts) < 2:
            continue

        card_id = parts[0]

        # Validar prefijo de idioma
        language_code = card_id[:2]
        if language_code not in ("SP", "EN", "PT", "DT"):
            errores.append(
                f"Línea {line_number}: Idioma desconocido en ID '{card_id}'."
            )
            continue

        # Validar parte numérica del ID (exactamente 6 dígitos)
        numeric_part = card_id[2:]
        if len(numeric_part) != 6 or not re.match(r"^\d{6}$", numeric_part):
            errores.append(
                f"Línea {line_number}: ID '{card_id}' inválido. "
                f"Debe tener exactamente 6 dígitos numéricos después del "
                f"código de idioma (ej: {language_code}123456)."
            )
            continue

        # Verificar ID duplicado en cartones previos
        if card_id in existing_ids:
            errores.append(
                f"Línea {line_number}: ID '{card_id}' ya existe en cartones "
                "cargados previamente."
            )
            continue

        # Verificar ID duplicado en la carga actual
        if card_id in ids_in_current_load:
            errores.append(
                f"Línea {line_number}: ID '{card_id}' está duplicado en "
                "este archivo/texto."
            )
            continue

        idioma: Idioma = language_code  # type: ignore
        raw_words = parts[1:]
        # Verificar que no haya palabras repetidas en el mismo cartón
        seen_words: set[str] = set()
        duplicate_words: set[str] = set()
        for w in raw_words:
            if w in seen_words:
                duplicate_words.add(w)
            else:
                seen_words.add(w)

        if duplicate_words:
            errores.append(
                f"Línea {line_number} ({card_id}): Palabras repetidas en el cartón: [{', '.join(sorted(duplicate_words))}]"
            )
            continue
        max_allowed = LIMITES[idioma]

        # Validar límite de palabras
        if len(raw_words) > max_allowed:
            errores.append(
                f"Línea {line_number} ({card_id}): Excede límite de "
                f"{max_allowed} palabras."
            )
            continue

        # Validar banco de palabras cargado
        word_bank = word_banks.get(idioma)
        if not word_bank or len(word_bank) == 0:
            errores.append(
                f"Línea {line_number}: Banco de palabras no cargado para {idioma}."
            )
            continue

        # Validar que todas las palabras existan en el banco
        invalid_words = [w for w in raw_words if w not in word_bank]
        if invalid_words:
            errores.append(
                f"Línea {line_number} ({card_id}): Palabras no permitidas "
                f"[{', '.join(invalid_words)}]"
            )
            continue

        # Ordenar palabras usando Merge Sort (algoritmo implementado)
        sorted_words = merge_sort(raw_words)

        ids_in_current_load.add(card_id)

        # Crear cartón válido
        carton = Carton(
            id=card_id,
            jugador=current_player,
            idioma=idioma,
            palabras=sorted_words,
            marcadas=[False] * len(sorted_words),
            total_aciertos=0,
            limite_palabras=len(sorted_words),
            ya_gano=False,
        )
        cartones.append(carton)

    return cartones, errores


def generate_random_rounds(available_languages: list[Idioma]) -> list[Idioma]:
    """
    Genera un orden aleatorio para las rondas del juego usando Fisher-Yates Shuffle.

    El algoritmo Fisher-Yates (también conocido como Knuth Shuffle) garantiza
    que todas las permutaciones posibles tienen igual probabilidad de ocurrir.

    Complejidad temporal: O(n)
    Complejidad espacial: O(n) para la copia

    Algoritmo:
    1. Crear copia del arreglo original
    2. Iterar desde el último elemento hacia el primero
    3. En cada iteración, seleccionar un índice aleatorio entre 0 e i (inclusive)
    4. Intercambiar el elemento en posición i con el elemento en posición aleatoria

    Args:
        available_languages: Lista de idiomas disponibles para las rondas

    Returns:
        Lista de idiomas en orden aleatorio
    """
    # Crear copia para no modificar la lista original
    languages = available_languages.copy()

    # Fisher-Yates shuffle (iteración hacia atrás)
    for i in range(len(languages) - 1, 0, -1):
        # Generar índice aleatorio entre 0 e i (inclusive)
        j = random.randint(0, i)
        # Intercambiar elementos
        languages[i], languages[j] = languages[j], languages[i]

    return languages
