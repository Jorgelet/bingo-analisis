"""
Proyecto Final - Bingo de Palabras
Algoritmos y Estructuras de Datos

Autores:
    - Jorge del Campo
    - Salvador Muñoz

    
"""

from models import Carton


def merge_sort(arr: list[str]) -> list[str]:
    """
    Ordena un arreglo de strings usando el algoritmo Merge Sort.

    Merge Sort: Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C.
      "Introduction to Algorithms", 3rd Edition, MIT Press, 2009.
      Capítulo 2.3: Designing algorithms (páginas 30-37)

    Implementación estándar del algoritmo sin modificaciones significativas respecto a la versión del libro de Cormen.


    El algoritmo divide recursivamente el arreglo en mitades hasta tener
    subarreglos de un solo elemento, luego los combina de forma ordenada.

    Args:
        arr: Lista de strings a ordenar

    Returns:
        Lista ordenada lexicográficamente (orden alfabético)

    Ejemplo:
        >>> merge_sort(["casa", "auto", "barco"])
        ['auto', 'barco', 'casa']
    """
    # Caso base: arreglos de 0 o 1 elemento ya están ordenados
    if len(arr) <= 1:
        return arr

    # Dividir el arreglo en dos mitades
    mid = len(arr) // 2
    left = arr[:mid]
    right = arr[mid:]

    # Ordenar recursivamente cada mitad
    sorted_left = merge_sort(left)
    sorted_right = merge_sort(right)

    # Combinar las mitades ordenadas
    return _merge(sorted_left, sorted_right)


def _merge(left: list[str], right: list[str]) -> list[str]:
    """
    Función auxiliar que combina dos listas ordenadas en una sola lista ordenada.

    Args:
        left: Primera lista ordenada
        right: Segunda lista ordenada

    Returns:
        Lista combinada y ordenada
    """
    result: list[str] = []
    left_index = 0
    right_index = 0

    # Comparar elementos de ambas listas y agregar el menor
    while left_index < len(left) and right_index < len(right):
        if left[left_index] < right[right_index]:
            result.append(left[left_index])
            left_index += 1
        else:
            result.append(right[right_index])
            right_index += 1

    # Agregar elementos restantes de ambas listas
    result.extend(left[left_index:])
    result.extend(right[right_index:])

    return result


def binary_search_mark(carton: dict, palabra: str) -> bool:
    """
    Busca una palabra en un cartón usando Búsqueda Binaria y la marca si existe.

     - Binary Search: Knuth, D. E. "The Art of Computer Programming",
      Volume 3: Sorting and Searching, 2nd Edition, Addison-Wesley, 1998.
      Sección 6.2.1: Searching an ordered table

    MODIFICACIÓN RESPECTO AL ALGORITMO CLÁSICO:
    Además de buscar, esta función modifica el estado del cartón:
    - Marca la palabra como encontrada (marcadas[mid] = True)
    - Incrementa el contador de aciertos (total_aciertos += 1)

    Args:
        carton: Diccionario con la estructura del cartón (palabras ordenadas)
        palabra: Palabra a buscar

    Returns:
        True si la palabra fue encontrada, False en caso contrario

    Precondición:
        Las palabras en carton["palabras"] deben estar ordenadas alfabéticamente
        (esto se garantiza al procesar los cartones con merge_sort)
    """
    palabras = carton["palabras"]
    marcadas = carton["marcadas"]

    left = 0
    right = len(palabras) - 1

    while left <= right:
        mid = (left + right) // 2
        mid_value = palabras[mid]

        if mid_value == palabra:
            # Palabra encontrada - MODIFICACIÓN: marcar y actualizar contador
            if not marcadas[mid]:
                marcadas[mid] = True
                carton["total_aciertos"] += 1
            return True

        if mid_value < palabra:
            # Buscar en la mitad derecha
            left = mid + 1
        else:
            # Buscar en la mitad izquierda
            right = mid - 1

    # Palabra no encontrada
    return False


def check_winners_greedy(cartones: list[dict]) -> list[dict]:
    """
    Detecta cartones ganadores usando una estrategia Greedy (voraz).

      - Greedy Algorithm: Diseño propio basado en estrategia voraz.
      Referencia conceptual: Cormen et al., Capítulo 16: Greedy Algorithms


    Args:
        cartones: Lista de diccionarios representando cartones

    Returns:
        Lista de cartones ganadores (aquellos con todas las palabras marcadas)
    """
    # Crear copia para no modificar la lista original durante el ordenamiento
    candidates = cartones.copy()

    # Ordenar por distancia a ganar (cantidad de palabras faltantes)
    # Estrategia greedy: procesar primero los más cercanos a completarse
    candidates.sort(
        key=lambda c: c["limite_palabras"] - c["total_aciertos"]
    )

    winners: list[dict] = []

    for carton in candidates:
        # Verificar si el cartón completó todas sus palabras
        if carton["total_aciertos"] == carton["limite_palabras"]:
            winners.append(carton)
        else:
            # OPTIMIZACIÓN EARLY-BREAK:
            # Como la lista está ordenada por palabras faltantes (ascendente),
            # si encontramos uno que no ganó, los siguientes tampoco ganaron
            break

    return winners
