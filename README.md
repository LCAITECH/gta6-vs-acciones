# GTA 6 vs. acciones de Take-Two

Calculadora educativa de [LCA ITECH](https://github.com/LCAITECH): compara comprar *Grand Theft Auto VI* (ediciones, DLC pagos y meses extra de GTA+) con haber invertido esa misma plata en acciones de Take-Two Interactive (NASDAQ: TTWO) el día de la compra.

Sitio estático, en español rioplatense, listo para GitHub Pages. No hace falta build.

**Esto no es consejo financiero.** Tampoco está afiliado a Rockstar Games, Take-Two, PlayStation, Microsoft, BingX ni Binance.

## Cómo se usa en local

Cualquier servidor estático en la raíz del repo, por ejemplo:

```bash
python3 -m http.server 8080
```

Abrí `http://localhost:8080`. El histórico de TTWO se carga desde `data/ttwo-daily.json`; si abrís el HTML como archivo (`file://`) el fetch puede fallar.

## Datos de mercado

El gráfico usa un **snapshot estático** de cierres diarios. Además, `data/ttwo-latest.json` guarda la última cotización de TTWO (precio, variación del día y hora de actualización en America/Buenos_Aires).

No hay una API gratuita, con CORS y términos claros, que el navegador pueda consultar desde GitHub Pages. Yahoo Finance no envía `Access-Control-Allow-Origin`, y sus términos (como los de Nasdaq) suelen restringir la redistribución. Por eso el sitio **no llama APIs en el cliente**.

Un workflow de GitHub Actions (`refresh-ttwo.yml`) corre cada 15 minutos, de lunes a viernes, entre las 14:00 y las 21:45 UTC (aprox. 11:00–18:45 hora Argentina), cubriendo la rueda de Nasdaq. Trae el dato en el servidor, lo guarda en el JSON y hace commit. También se puede disparar a mano (`workflow_dispatch`) o correr `python3 scripts/refresh-ttwo.py --quote` en local.

El **histórico diario** (`data/ttwo-daily.json`) se actualiza una vez por día de lunes a viernes a las 22:30 UTC, ya cerrada la rueda, con los cierres oficiales (Yahoo cruzado con Nasdaq). Entre una corrida y otra, `--quote` suma al histórico la rueda que acaba de cerrar (nunca un precio parcial de la rueda en curso), así que quien compra el día del lanzamiento no queda con un precio de entrada viejo. Para forzar la actualización completa: `gh workflow run refresh-ttwo.yml -f history=true`.

El recuadro **TTWO ahora** muestra ese snapshot y la hora: “actualizado hh:mm (hora Argentina)”. Si el archivo no está, la calculadora cae al último cierre diario.

Lo mismo para **bitcoin (BTC/USD)**: `scripts/refresh-btc.py` (GitHub Action cada 3 horas) escribe `data/btc-latest.json` y `data/btc-daily.json` desde la API pública de Bitstamp. El sitio no llama a Bitstamp en el cliente. Coinbase no se usó (sus términos de market data no permiten mostrar esos datos a terceros sin consentimiento). Ver `FUENTES.md`.


## Quién dispara los refrescos

Los `schedule` de GitHub Actions son "best effort": con carga los demoran horas o los descartan (el 19/11/2026 el cron de TTWO corrió 0 de unas 27 veces esperadas). Por eso los workflows de datos los dispara también un Worker con Cron Trigger de Cloudflare (`cron-worker/`), que llama a la API de GitHub (`workflow_dispatch`) a la hora justa. Hay una sola cron cada 15 minutos y el código decide qué sale en cada tick (hora UTC):

| Workflow | Cuándo |
|---|---|
| TTWO (cotización) | cada 15 min, lunes a viernes, 14:00–21:45 |
| TTWO (histórico oficial, `history=true`) | lunes a viernes, 22:30 |
| Dólar | cada hora, lunes a viernes, 13:00–21:00, y todos los días a las 06:00 |
| BTC | cada 3 horas, en el minuto :15 |
| Hardware | cada 6 horas, en el minuto :30 |

Los `schedule` de los workflows quedan como respaldo: si corren ambos, `concurrency: data-refresh` los encola. Cada workflow cae en un minuto distinto para que nunca haya más de dos por tick, porque GitHub guarda solo una corrida en curso y una pendiente por grupo de concurrencia.

Puesta en marcha, una sola vez:

1. Creá un token en GitHub: Settings → Developer settings → Fine-grained tokens. Repositorio: solo `LCAITECH/gta6-vs-acciones`. Permiso: *Actions → Read and write*. Ponele vencimiento y anotá la fecha para renovarlo.
2. `cd cron-worker && npx wrangler deploy`
3. `npx wrangler secret put GH_TOKEN` y pegá el token.
4. Verificá en el próximo múltiplo de 15 minutos: `npx wrangler tail`, y que aparezcan corridas con evento `workflow_dispatch` en la pestaña Actions.

Si el token vence o se revoca, la invocación falla de forma visible en el panel de Cloudflare y los `schedule` de GitHub siguen como respaldo.

## Cotizaciones en Argentina

`data/fx-ar.json` se actualiza cada hora de 10 a 18 (hora Argentina) en días hábiles, y una vez de noche (GitHub Actions + `scripts/refresh-fx.py`) con oficial, tarjeta, blue, MEP, CCL y cripto, desde [DolarApi](https://dolarapi.com) ([uso de los datos](https://dolarapi.com/docs/uso); hay que citar “DolarApi https://dolarapi.com”). El comparador “tarjeta cripto vs tarjeta bancaria” convierte a pesos: el banco usa oficial venta + IVA 21% (sin el 30% de percepción, porque PSN, Microsoft y Rockstar están excluidos). La cripto se fondea al dólar que elijas (cripto/USDT por defecto) + comisión − cashback.

## Pagos con tarjeta cripto

En “Cuánto pagás de verdad” se compara el total de la tienda (con los impuestos que el usuario tilde) contra pagar el precio de lista con la **BingX Card**. El 2% de cashback y el 1,5% de comisión se muestran como dato informado por el dueño del sitio, alineado con la tarifa oficial de transacción de 1,50% y el cashback del tramo inicial; hay que verificarlo en la app.

El enlace “Págalo con la BingX card” es de referido de la tarjeta. El de “Págalo con la Binance Card” es un referido general de alta en Binance, no un referido específico de la Card.

## Placeholders y huecos

- Comisión de la Binance Card: no publicada / no verificada (no se inventa). El IVA en esa tarjeta está sin confirmar; el comparador lo suma por defecto y se puede apagar.
- Precios de DLC de historia o add-ons pagos de GTA 6: no publicados al 18/11/2026. El usuario puede cargarlos a mano.
- Precio físico en otras cadenas o de otras ediciones: si no está en FUENTES.md, el usuario lo carga a mano.
- Versión de PC al lanzamiento: no publicada.
- Alícuota de Ingresos Brutos: no hay una única nacional; queda en 0 para que cada quien complete la de su provincia.

## Licencia

MIT. Ver `LICENSE`.

## Privacidad y estadísticas

El sitio cuenta visitas y clics con un Worker propio de Cloudflare (`analytics-worker/`, base D1 `gta6-analytics`). Se guarda solo: tipo de evento, ruta (sin parámetros), dominio de referencia, país (encabezado de Cloudflare), tipo de dispositivo (móvil/tablet/escritorio) y fecha y hora. No se guardan IPs, user agents, cookies ni identificadores, y se respeta Do Not Track. El panel `stats.html` está protegido con una clave que no está en el repo. El Worker limita por IP la cantidad de eventos y de votos por minuto (la clave del límite no se guarda): el chequeo de `Origin` solo frena a otros sitios web, no a un script.

## Secciones extra

La navegación es por vistas con hash (`#calculadora`, `#jodita`, `#conviene`, `#ttwo`, `#desafio`, `#oficial`, `#encuesta`, `#fuentes`); los links y el botón atrás abren la vista correcta.

- **Calculadora**: comparás la plata del juego (por defecto el precio de la edición, p. ej. US$ 99,99) en TTWO, en BTC o en los dos, con ganancia o pérdida, un desglose a 1 semana / 1 mes / 3 / 6 meses / 1 año, y el gráfico de las dos líneas.
- **La jodita del GTA VI**: consola (PS5 Slim Digital y Standard, Pro, Series S/X) + juego digital o en caja + membresía + upgrade + tele + otros, en pesos, con cuotas por tienda, tarjeta del banco vs BingX vs Binance, escenarios con/sin consola y con/sin tele, y qué valdría el ahorro en TTWO.
- **¿Me conviene?**: tabla de rendimiento por plataforma (Digital Foundry, 18/11/2026) más el precio ARS de hoy.
- **TTWO**: gráfico interactivo de cierres diarios de TTWO y de BTC (precio o % desde el mismo inicio; rangos 1M–Máx) a partir de `data/ttwo-daily.json` y `data/btc-daily.json`.
- **Desafío Gordo Compu** (`#desafio`): sub-pestañas Comparar / Armar PC / Meta y simulación / Encuesta. Comparador placa vs consola (ARS, USD al MEP y acciones TTWO) a partir de `data/hardware-prices.json` (refresco automático cada ~6 h, no es un tick en vivo). Armador con presets, chequeo de socket/RAM, totales, y gabinete 3D (CSS, se carga al abrir Armar). Sub-pestaña Metas: objetivo (PC nueva / placa / RAM / procesador) del catálogo verificado, plazo en meses y fecha (solo aportes y con supuesto de TTWO, BTC o mitad y mitad), barra de avance, escenarios (aporte ×2/×3, baja del componente, variación del activo) y celebración si ya llegaste. Simulador de proyección con horizonte de 1 a 12 meses y selector de activo (TTWO / BTC / mitad y mitad). Encuesta en vivo (barras cada ~30 s) también en esta vista.
- **Consola hoy vs esperar la PC**: misma lógica, con una fecha de PC elegida por el usuario (no hay fecha oficial) o un modo “esperar a fin de noviembre (Black Friday)” que muestra el mejor precio verificado de hoy, sin inventar descuentos.
- **Encuesta**: votos en D1 vía el Worker de analítica; barras en vivo también en el Desafío.
- **Lo oficial** (`#oficial`): tráileres oficiales de Rockstar Games incrustados desde su canal de YouTube (se piden recién al tocar «Ver», con `youtube-nocookie.com`) y links a su sitio. No se aloja ni se copia nada de Rockstar, y los links no son de referido. Los IDs de video están en `oficial.js`, verificados contra el feed público del canal. Además enlaza (sin alojar nada) al póster oficial «Mapa de Leónida», que Rockstar publica para descargar en su galería de arte, y a su página de música. No hay un mapa interactivo oficial: los interactivos que existen son de fans.
