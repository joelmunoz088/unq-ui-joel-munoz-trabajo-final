# Palabras Encadenadas — Trabajo Final Integrador (UIs - UNQ)

Aplicación web desarrollada en **React + TypeScript** con **Vite** para el Trabajo Final Integrador de Construcción de Interfaces de Usuario (UNQ).

## Descripción del juego

El objetivo es formar la cadena más larga posible de palabras válidas en español antes de que se agote el tiempo:

- La primera palabra puede ser cualquier palabra válida en español.
- A partir de la segunda palabra, cada nueva palabra debe comenzar con la última letra de la palabra anterior (ignorando tildes) y no haberse repetido en la partida.
- Cada letra de una palabra válida suma **1 punto**.
- Cada turno dura **15 segundos** (comienza al ingresar la primera palabra válida y se reinicia a 15s con cada acierto).
- Incluye reinicio de partida, diseño responsive y un **Top 10 de mejores puntajes** persistido en `localStorage`.

## Requisitos previos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- npm

## Descarga, instalación y ejecución local

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/joelmunoz088/unq-ui-joel-munoz-trabajo-final.git](https://github.com/joelmunoz088/unq-ui-joel-munoz-trabajo-final.git)
   ```

2. Ingresar al directorio del proyecto:
   ```bash
   cd unq-ui-joel-munoz-trabajo-final
   ```

3. Instalar las dependencias:
   ```bash
   npm install
   ```

4. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abrir en el navegador la URL indicada en la terminal (por defecto `http://localhost:5173`).