"""
Proyecto Final - Bingo de Palabras
Algoritmos y Estructuras de Datos

Autores:
    - Jorge del Campo

Referencias:
    - Pydantic: Documentación oficial https://docs.pydantic.dev/
    - FastAPI: Documentación oficial https://fastapi.tiangolo.com/

Descripción:
    Este módulo define los modelos de datos (schemas) utilizados para la
    validación y serialización de datos en la API REST del juego de Bingo.
"""

from typing import Literal
from pydantic import BaseModel


# Tipo de idioma soportado
Idioma = Literal["SP", "EN", "PT", "DT"]


class Carton(BaseModel):
    """
    Representa un cartón de bingo con sus palabras y estado de marcado.

    Attributes:
        id: Identificador único del cartón (ej: SP123456)
        jugador: Nombre/ID del jugador propietario (ej: J1)
        idioma: Código del idioma (SP, EN, PT, DT)
        palabras: Lista de palabras ordenadas alfabéticamente
        marcadas: Lista de booleanos indicando palabras marcadas
        total_aciertos: Contador de palabras acertadas
        limite_palabras: Total de palabras en el cartón
        ya_gano: Indica si el cartón ya ganó en una ronda anterior
    """

    id: str
    jugador: str
    idioma: Idioma
    palabras: list[str]
    marcadas: list[bool]
    total_aciertos: int
    limite_palabras: int
    ya_gano: bool = False


class ProcessCardsRequest(BaseModel):
    """Request para procesar texto de entrada con cartones."""

    text: str
    existing_ids: list[str] = []


class ProcessCardsResponse(BaseModel):
    """Response con cartones procesados y errores encontrados."""

    cartones: list[Carton]
    errores: list[str]


class CallWordRequest(BaseModel):
    """Request para cantar una palabra."""

    cartones: list[Carton]
    palabra: str
    idioma_actual: Idioma


class CallWordResponse(BaseModel):
    """Response con cartones actualizados después de cantar palabra."""

    cartones: list[Carton]
    found_in_any: bool


class CheckWinnersRequest(BaseModel):
    """Request para verificar ganadores."""

    cartones: list[Carton]


class CheckWinnersResponse(BaseModel):
    """Response con lista de cartones ganadores."""

    ganadores: list[Carton]


class GenerateRoundsRequest(BaseModel):
    """Request para generar orden aleatorio de rondas."""

    idiomas_disponibles: list[Idioma]


class GenerateRoundsResponse(BaseModel):
    """Response con orden de rondas aleatorizado."""

    rondas: list[Idioma]


class ValidateWordRequest(BaseModel):
    """Request para validar si una palabra existe en el banco."""

    palabra: str
    idioma: Idioma


class ValidateWordResponse(BaseModel):
    """Response indicando si la palabra es válida."""

    es_valida: bool
