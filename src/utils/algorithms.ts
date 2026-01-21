export type Idioma = "SP" | "EN" | "PT" | "DT";

export interface Carton {
  id: string;
  jugador: string;
  idioma: Idioma;
  palabras: string[];
  marcadas: boolean[];
  totalAciertos: number;
  limitePalabras: number;
  yaGano?: boolean;
}

/**
 * Sorts an array of strings using the Merge Sort algorithm.
 * Does NOT use native Array.sort().
 * @param arr - Array of strings to sort
 * @returns Sorted array in lexicographic order
 */
export function mergeSort(arr: string[]): string[] {
  if (arr.length <= 1) {
    return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  return merge(mergeSort(left), mergeSort(right));
}

function merge(left: string[], right: string[]): string[] {
  const result: string[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

/**
 * Searches for a word in a Carton using Binary Search.
 * If found, marks the word and updates the hit counter.
 * @param carton - The bingo card to search in
 * @param palabra - The word to find
 * @returns true if word was found, false otherwise
 */
export function binarySearchMark(carton: Carton, palabra: string): boolean {
  let left = 0;
  let right = carton.palabras.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = carton.palabras[mid];

    if (midValue === palabra) {
      if (!carton.marcadas[mid]) {
        carton.marcadas[mid] = true;
        carton.totalAciertos++;
      }
      return true;
    }

    if (midValue < palabra) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return false;
}

/**
 * Detects winners using a Greedy strategy.
 * Sorts cards by "distance to win" (ascending) and returns those fully completed.
 * Uses early break optimization once a non-winner is found.
 * @param cartones - Array of cards to check
 * @returns Array of winning cards
 */
export function checkWinnersGreedy(cartones: Carton[]): Carton[] {
  const candidates = [...cartones];

  candidates.sort((a, b) => {
    const missingA = a.limitePalabras - a.totalAciertos;
    const missingB = b.limitePalabras - b.totalAciertos;
    return missingA - missingB;
  });

  const winners: Carton[] = [];

  for (const carton of candidates) {
    if (carton.totalAciertos === carton.limitePalabras) {
      winners.push(carton);
    } else {
      break;
    }
  }

  return winners;
}
