# Handoff general

Índice de sesiones del proyecto. Cada sesión tiene su archivo con el detalle y los pendientes.
**Al empezar una sesión:** leer esta página y el último handoff. **Al cerrarla:** crear el handoff de la sesión y sumar una fila acá.

## Qué es el proyecto

Calculadora educativa de GTA VI para Argentina: cuánto cuesta en ARS/USD y qué pasaría si esa plata se invirtiera en TTWO y/o BTC. Sitio estático en GitHub Pages (`gta6.lcaitech.com`), datos en `data/*.json` refrescados por scripts Python, y un Worker de Cloudflare (D1) para analytics y la encuesta.
Repo: `LCAITECH/gta6-vs-acciones`. Carpeta local: `D:\GTA VI CALCULADORA`.

## Sesiones

| # | Fecha | Handoff | Resumen |
|---|---|---|---|
| 01 | 19–20/11/2026 | [sesion-01-2026-11-19.md](sesion-01-2026-11-19.md) | Rescate del repo y revisión de código. Se arregló el histórico de TTWO, se unificaron los precios de hardware y se limitó `/e`. Se sumó la vista «Lo oficial». Los datos pasaron a cierre diario. Se decidió una arquitectura híbrida (Pages + servidor casero). |

## Pendientes abiertos (resumen; el detalle está en el handoff de la sesión)

- **P1** Escribir `AGENTS.md` y `CLAUDE.md` con las reglas acordadas (permiso antes de tocar código, tope de 450 líneas con tolerancia de 50, handoffs, auditorías).
- **P1** Migrar crons y backend al servidor casero (notebook Linux por SSH).
- **P1** Desplegar `analytics-worker` (límite de `/e` y eventos nuevos todavía inactivos).
- **P2** Modularizar `app.js`, `styles.css`, `extras.js`, `index.html` y `goals.js` (todos pasan las 500 líneas).
- **P2** Scraper de hardware bloqueado (403 en 39 de 44 ítems).
- **P3** Hallazgos menores de la revisión y recomendaciones de diseño.

## Auditorías

Todavía no hubo ninguna. Cuando se hagan, anotarlas acá con fecha y qué se resolvió.
