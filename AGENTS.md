# AGENTS.md · reglas de trabajo

Valen para cualquier agente (Claude u otro) y para cualquier persona que toque este repo. `CLAUDE.md` manda leer este archivo primero; si algo se contradice, **gana este archivo**.

Contexto: calculadora educativa de GTA VI para Argentina (`gta6.lcaitech.com`). Va a ser importante en los próximos años, sobre todo en 2027, así que se prioriza que esté bien hecha, ordenada y documentada por encima de ir rápido.

## 1. Pedir permiso antes de tocar código

- No mover, renombrar, reescribir ni borrar código que no se haya pactado con el usuario en la conversación.
- Si durante una tarea aparece algo más para arreglar o refactorizar, **se avisa y se pregunta**; no se hace de paso. Se anota como pendiente en el handoff.
- «Pactado» = el usuario lo pidió o lo aprobó para esta tarea. Que un arreglo sea chico no lo vuelve pactado.
- Excepción: los archivos de `data/` los reescriben los refrescos automáticos; no se editan a mano ni necesitan permiso.

## 2. Tamaño de archivos: 450 líneas, con 50 de tolerancia

Aplica a lo que se mantiene a mano: `*.js`, `*.css`, `*.html` y `*.py`. No aplica a `data/*.json`, a documentos Markdown ni a archivos generados.

| Líneas | Zona | Qué hacer |
|---|---|---|
| hasta 450 | verde | Nada. |
| 451 a 500 | tolerancia | Se permite, pero **se avisa** y se anota en el handoff para modularizar en la próxima oportunidad. Cuanto más cerca de 500, más urgente. |
| más de 500 | roja | No se agrega código a ese archivo sin un plan de modularización acordado con el usuario. Entra en la lista de deuda del handoff. |

- Se mide con: `git ls-files '*.js' '*.css' '*.html' '*.py' | xargs wc -l | sort -rn`
- Al terminar una tarea, revisar los archivos tocados y avisar si alguno cambió de zona.
- Modularizar es un cambio de código: aplica la regla 1 (se pacta el corte antes), se prueba en el navegador (no hay tests ni build) y va en su propio commit, sin mezclar cambios de comportamiento.
- La línea base y la deuda vigente están en el handoff (ver regla 4).
- La tolerancia no exime de modularizar: el objetivo es modularizar todo, incluso un archivo de ~500 líneas (ver regla 7).

## 3. Git y publicación

- Los cambios van a una **rama nueva**; nunca directo a `main`. Mensajes de commit en español.
- Se commitea solo cuando el usuario lo pide, y se agregan los archivos por nombre (no `git add -A`).
- Se mergea a `main` solo cuando el usuario lo pide: `git fetch`, revisar solapamiento con commits del bot, merge `--ff-only` (rebasear la rama si hace falta), `git push origin main` y verificar el build de Pages y el sitio en vivo.
- `main` publica el sitio, así que no se rompe. Los commits de datos del bot llegan todo el tiempo: siempre `fetch` antes de mergear.
- Nada de force-push ni de reescribir historial sin un pedido explícito.

## 4. Documentación, handoffs y auditorías

- Los handoffs viven en el repo **privado** `LCAITECH/gta6-ops` (clon local: `D:\gta6-ops`), no acá.
- **Al empezar una sesión:** `git pull` en ese repo y leer `handoff/HANDOFF.md` y el último `handoff/sesion-NN-….md`.
- **Al cerrar una sesión:** escribir `handoff/sesion-NN-AAAA-MM-DD.md` (qué se hizo, decisiones y por qué, estado, pendientes con prioridad) y sumar una fila con un resumen chico a `HANDOFF.md`.
- Lo que cambie cómo funciona el sitio o los datos también se documenta acá, en `README.md` y `FUENTES.md`.
- **Auditorías:** cada cierto tiempo (la frecuencia se define con el usuario) una sesión se dedica a revisar los pendientes abiertos, modularizar archivos en zona de tolerancia o roja, buscar duplicados (código, datos, textos) y cerrar lo viejo. El resultado va a `auditorias/` del repo privado.

## 5. Secretos y privacidad

- Ni en este repo ni en el privado: claves, tokens, contraseñas, deploy keys, IPs ni mails personales. Viven en el servidor o en los secretos de Cloudflare y GitHub.
- Este repo es público: no se escriben acá hallazgos de seguridad abiertos, análisis legales ni detalles del servidor. Eso va a los handoffs privados.
- De Rockstar y Take-Two se linkea o embebe desde su sitio oficial; no se aloja nada suyo.

## 6. Idioma

El usuario escribe en español rioplatense informal. Documentos, commits y respuestas, en español rioplatense (voseo).

## 7. Modularidad

- El código se mantiene lo más modularizado posible: cada pieza vive en el módulo que le corresponde por responsabilidad.
- No se crean archivos de código nuevos solo por agregar código, ni se suma código a un archivo que no es el suyo. Antes de escribir, se busca el módulo donde encaja.
- Si lo que se hace es algo nuevo (un efecto, una sección, una funcionalidad propia), va en su propio módulo, con un nombre claro. Si ya existe un módulo de ese tema, va ahí.
- Modularizar lo existente sigue las reglas 1 y 2: el corte se pacta antes con el usuario y va en su propio commit, sin cambios de comportamiento.
