"""
Proyecto Final - Bingo de Palabras
Algoritmos y Estructuras de Datos

Autores:
    - Jorge del Campo

Referencias:
    - FastAPI: Documentación oficial https://fastapi.tiangolo.com/
    - CORS Middleware: https://fastapi.tiangolo.com/tutorial/cors/
    - Pydantic: https://docs.pydantic.dev/

Descripción:
    Servidor API REST que expone los algoritmos del juego de Bingo.
    Los algoritmos principales (Merge Sort, Binary Search, Greedy) se
    encuentran implementados en algorithms.py con sus respectivas
    referencias académicas.

Ejecución:
    uvicorn main:app --reload --port 8000
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ProcessCardsRequest,
    ProcessCardsResponse,
    CallWordRequest,
    CallWordResponse,
    CheckWinnersRequest,
    CheckWinnersResponse,
    GenerateRoundsRequest,
    GenerateRoundsResponse,
    ValidateWordRequest,
    ValidateWordResponse,
    Carton,
)
from algorithms import binary_search_mark, check_winners_greedy
from game_logic import process_input_data, generate_random_rounds, LIMITES


# Almacenamiento de bancos de palabras (cargados al iniciar)
word_banks: dict[str, set[str]] = {}


def load_word_banks() -> dict[str, set[str]]:
    """
    Carga los bancos de palabras desde archivos .txt

    Los archivos tienen formato: ['palabra1', 'palabra2', ...]
    """
    banks: dict[str, set[str]] = {}
    languages = ["SP", "EN", "PT", "DT"]

    # Buscar archivos en el directorio word_banks
    base_paths = [
        Path(__file__).parent / "word_banks",
    ]

    for lang in languages:
        banks[lang] = set()

        for base_path in base_paths:
            file_path = base_path / f"banco_{lang}.txt"
            if file_path.exists():
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        # Limpiar formato ['palabra1', 'palabra2', ...]
                        clean_content = content.replace("[", "").replace("]", "").replace("'", "")
                        words = [w.strip() for w in clean_content.split(",")]
                        banks[lang] = set(words)
                        print(f"Cargado banco {lang}: {len(banks[lang])} palabras")
                        break
                except Exception as e:
                    print(f"Error cargando banco {lang}: {e}")

    return banks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager para cargar recursos al iniciar."""
    global word_banks
    print("Cargando bancos de palabras...")
    word_banks = load_word_banks()
    print(f"Bancos cargados: {list(word_banks.keys())}")
    yield
    print("Servidor detenido")


# Crear aplicación FastAPI
app = FastAPI(
    title="Bingo de Palabras API",
    description="API REST para el juego de Bingo de Palabras con algoritmos de ordenamiento y búsqueda",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Endpoint de salud/información."""
    return {
        "message": "Bingo de Palabras API",
        "version": "1.0.0",
        "endpoints": [
            "/api/process-cards",
            "/api/call-word",
            "/api/check-winners",
            "/api/generate-rounds",
            "/api/validate-word",
            "/api/word-limits",
            "/api/word-banks",
        ],
    }


@app.get("/api/word-limits")
async def get_word_limits():
    """Retorna los límites de palabras por idioma."""
    return {"limites": LIMITES}


@app.get("/api/word-banks")
async def get_word_banks():
    """
    Retorna todos los bancos de palabras cargados.
    
    Cada banco se retorna como una lista de palabras para facilitar
    su uso en el frontend.
    """
    return {
        "bancos": {
            lang: list(words) for lang, words in word_banks.items()
        }
    }


@app.post("/api/process-cards", response_model=ProcessCardsResponse)
async def process_cards(request: ProcessCardsRequest):
    """
    Procesa texto de entrada y extrae cartones validados.

    Utiliza:
    - Parsing jerárquico para estructura Jugador -> Cartones
    - Merge Sort para ordenar palabras de cada cartón
    - Validación contra bancos de palabras oficiales
    """
    existing_ids = set(request.existing_ids)
    cartones, errores = process_input_data(request.text, word_banks, existing_ids)

    return ProcessCardsResponse(cartones=cartones, errores=errores)


@app.post("/api/call-word", response_model=CallWordResponse)
async def call_word(request: CallWordRequest):
    """
    Procesa el cantado de una palabra.

    Utiliza Binary Search para buscar eficientemente la palabra
    en cada cartón del idioma actual.
    """
    # Convertir Pydantic models a dicts para poder modificarlos
    cartones_dicts = [c.model_dump() for c in request.cartones]
    found_in_any = False

    for carton in cartones_dicts:
        # Solo procesar cartones del idioma actual que no hayan ganado
        if carton["idioma"] == request.idioma_actual and not carton["ya_gano"]:
            # Usar Binary Search para buscar y marcar
            if binary_search_mark(carton, request.palabra):
                found_in_any = True

    # Convertir de vuelta a Pydantic models
    cartones_updated = [Carton(**c) for c in cartones_dicts]

    return CallWordResponse(cartones=cartones_updated, found_in_any=found_in_any)


@app.post("/api/check-winners", response_model=CheckWinnersResponse)
async def check_winners(request: CheckWinnersRequest):
    """
    Verifica y retorna los cartones ganadores.

    Utiliza algoritmo Greedy con optimización early-break:
    ordena por distancia a ganar y retorna los completados.
    """
    # Filtrar solo cartones que no hayan ganado previamente
    cartones_dicts = [
        c.model_dump() for c in request.cartones if not c.ya_gano
    ]

    # Usar algoritmo greedy para detectar ganadores
    winners_dicts = check_winners_greedy(cartones_dicts)

    # Convertir a Pydantic models
    ganadores = [Carton(**w) for w in winners_dicts]

    return CheckWinnersResponse(ganadores=ganadores)


@app.post("/api/generate-rounds", response_model=GenerateRoundsResponse)
async def generate_rounds(request: GenerateRoundsRequest):
    """
    Genera orden aleatorio de rondas.

    Utiliza Fisher-Yates Shuffle para garantizar
    distribución uniforme de probabilidades.
    """
    rondas = generate_random_rounds(request.idiomas_disponibles)
    return GenerateRoundsResponse(rondas=rondas)


@app.post("/api/validate-word", response_model=ValidateWordResponse)
async def validate_word(request: ValidateWordRequest):
    """Valida si una palabra existe en el banco del idioma especificado."""
    bank = word_banks.get(request.idioma, set())
    es_valida = request.palabra in bank

    return ValidateWordResponse(es_valida=es_valida)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
