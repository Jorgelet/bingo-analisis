# Bingo_P

Sistema de gestión de bingo de palabras masivo. Soporta múltiples idiomas (Español, Inglés, Portugués, Dutch) y más de 200 cartones simultáneos.

## Requisitos

- Node.js 18+
- npm

## Instalar Node.js y npm

Saltar si ya se tiene Node.js y NPM

Se recomiendan dos opciones: usar `nvm` (recomendado, gestiona versiones) o instalar desde el gestor de paquetes del sistema.

Opción A — nvm (recomendado):

```bash
# Instalar nvm
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash

# Instalar y usar Node 18 (LTS)
nvm install 18
nvm use 18
```

Verificar instalación:

```bash
node -v
npm -v
```

## Instalación


```bash
npm install
```

## Ejecución

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Ejecutar el backend (API)

Requisitos: Python 3.10+.

1. Entrar en la carpeta del backend e instalar dependencias en un virtualenv:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

2. Ejecutar el servidor

```bash
uvicorn main:app --reload --port 8000
```

El servidor quedará disponible en `http://127.0.0.1:8000`. 
--

## Ejecutar el frontend (UI)

Requisitos: Node.js 18+ y npm.

1. Instalar dependencias (desde la raíz del proyecto):

```bash
npm install
```

2. Ejecutar el servidor de desarrollo de Next.js:

```bash
npm run dev
```

La UI estará en `http://localhost:3000`. Asegúrate de tener el backend corriendo en `http://localhost:8000` antes de usar la interfaz para que las llamadas a la API funcionen correctamente.

## Uso

1. Carga cartones desde un archivo `.txt` o ingresa manualmente
2. Formato de entrada:
   ```
   J1
   SP123456 palabra1 palabra2 palabra3
   EN654321 word1 word2
   J2
   PT111111 palavra1 palavra2
   ```
3. Inicia la partida y canta palabras para marcar cartones
4. El sistema detecta ganadores automáticamente
