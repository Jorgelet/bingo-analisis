# Bingo_P

Sistema de gestión de bingo de palabras masivo. Soporta múltiples idiomas (Español, Inglés, Portugués, Dutch) y más de 200 cartones simultáneos.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

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
