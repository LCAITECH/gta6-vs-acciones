# Fuentes relevadas el 18/11/2026 (America/Buenos_Aires)

Cada cifra usada en el sitio tiene URL y fecha. Si no había un dato publicado, se dejó como “no publicado”. No se usaron precios de otro país como si fueran argentinos.

## Juego

| Dato | Valor | Fuente |
| --- | --- | --- |
| Lanzamiento | 19/11/2026, PS5 y Xbox Series X\|S | [Take-Two, 24/06/2026](https://taketwointeractivesoftwareinc.gcs-web.com/news-releases/news-release-details/rockstar-games-announces-pre-orders-grand-theft-auto-vi/) |
| Reservas | Desde el 25/06/2026 a medianoche local | Misma gacetilla |
| Precio de lista USD | Estándar US$ 79,99 · Ultimate US$ 99,99 | Misma gacetilla |
| PlayStation Store AR | Estándar US$ 79,99 · Ultimate US$ 99,99 · mejora “No disponible” | [Estándar](https://store.playstation.com/es-ar/product/EP1004-PPSA01547_00-GTAVISTANDARD001) · [Ultimate](https://store.playstation.com/es-ar/product/EP1004-PPSA01547_00-GTAVIULTIMATE001) (consultadas el 18/11/2026) |
| Xbox Store AR | Estándar ARS 113.299+ · Ultimate ARS 141.990+ · mejora ARS 28.691 | [Estándar](https://www.xbox.com/es-AR/games/store/grand-theft-auto-vi/9P3H4968GRSM/0017) · [Ultimate](https://www.xbox.com/es-AR/games/store/grand-theft-auto-vi-ultimate-edition/9NNZSNHLR63L) (18/11/2026) |
| GTA+ PS Store AR | US$ 7,99 / mes | [Ficha](https://store.playstation.com/es-ar/product/UP1004-PPSA16755_00-GTAPLUS00001T01M) (18/11/2026) |
| GTA+ Xbox Store AR | ARS 6.670 / mes | [Ficha](https://www.xbox.com/es-AR/games/store/gta-xbox-series-xs/cfq7ttc0hx8w) (18/11/2026) |
| DLC de historia / Shark Cards de GTA 6 | no publicado | — |
| Precio físico en Argentina | no publicado | No se verificó góndola |
| PC al lanzamiento | no publicado | El anuncio oficial cubre consolas de generación actual |

## Impuestos y tipo de cambio

| Dato | Valor | Fuente |
| --- | --- | --- |
| IVA servicios digitales | Régimen de percepción; alícuota general 21% | [RG 4240/2018, ARCA](https://www.afip.gov.ar/iva/servicios-digitales/reg-percepcion-4240.asp) |
| Percepción 30% | Alícuota 30% (RG 5617) | [ARCA](https://www.arca.gob.ar/regimen-devolucion-percepciones/percepcion/importe.asp) |
| Exclusión para juegos | PSN, Microsoft y Rockstar Games figuran en el anexo, vigencia 16/04/2025 | [Texto RG 5677/2025](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-5677-2025-411846/texto) · anexo oficial IF-2025-01511146-AFIP-SGDADVCOAD#SDGPCI |
| BNA billete (18/11/2026) | Compra 1.525,00 · Venta 1.575,00 | [bna.com.ar/Personas](https://www.bna.com.ar/Personas) |
| BNA divisas (18/11/2026) | Compra 1.543,00 · Venta 1.552,00 | Misma página |


| Cotizaciones (refresco automático) | oficial, tarjeta, blue, MEP (bolsa), CCL, cripto (USDT/USDC) en `data/fx-ar.json` | [DolarApi https://dolarapi.com](https://dolarapi.com) · [Uso de los datos](https://dolarapi.com/docs/uso) (cita requerida; permite copia local y publicación; sugiere 1 consulta cada 3 h por serie) |
| Dólar tarjeta genérico | Oficial venta × 1,30 = 2.047,50 el 18/11/2026. **No se usa** para PSN / Microsoft / Rockstar (excluídos de la percepción 30% por RG 5677/2025). El comparador banco vs cripto usa oficial venta + IVA 21% (+ IIBB si lo cargás). | DolarApi · coincide con un agregado visto por el dueño ~10:03 (hora Argentina) el 18/11/2026 (solo como control) |
| Dólar cripto | Cotización de referencia de DolarApi para USDT/USDC (venta). El usuario puede fondear también a blue, MEP u oficial. | Misma API |

Cadencia: GitHub Actions corre `scripts/refresh-fx.py` cada 3 horas (`7 */3 * * *`) y en disparo manual. El sitio no llama a la API desde el navegador. Se muestra “actualizado hh:mm (hora Argentina)” y la cita a DolarApi. Si el JSON no carga, se usan valores de referencia del 18/11/2026 ~10:03 (hora Argentina).

La calculadora suma los tributos en forma aditiva: `lista × (1 + IVA + percepción + IIBB)`. IIBB queda en 0 por defecto porque no hay una alícuota nacional única.

## TTWO

- Cotización “casi en vivo”: `data/ttwo-latest.json`, generado en el servidor (GitHub Actions cada 15 minutos en horario de Nasdaq, o `scripts/refresh-ttwo.py --quote`). Fuente: Yahoo Finance, sin llamadas desde el navegador (no hay CORS habilitado y los términos no prestan para un feed en el cliente). La tarjeta “TTWO ahora” muestra precio, variación del día y “actualizado hh:mm (hora Argentina)”. Si falta el snapshot, se usa el último cierre.


- Último cierre: **US$ 203,93 el 17/11/2026**. Coincide en [Nasdaq](https://www.nasdaq.com/market-activity/stocks/ttwo/historical) y [Yahoo Finance](https://finance.yahoo.com/quote/TTWO/history/).
- Snapshot de 501 ruedas (18/11/2024 a 17/11/2026) en `data/ttwo-daily.json`.
- Se eligió un corte estático de build, no un feed en vivo, para no exponer una API en el cliente y para no depender de un servicio pago. Las condiciones de Yahoo y Nasdaq suelen restringir la redistribución de datos de mercado; el archivo se publica solo como recorte ilustrativo, con atribución y fecha. Stooq se descartó porque su [términos](https://stooq.com/terms.html) prohíben redistribuir sin consentimiento.
- Referencia del emisor: [Take-Two IR Historical Price Lookup](https://taketwointeractivesoftwareinc.gcs-web.com/historical-price-lookup/). Al consultarlo el 18/11/2026 la tabla visible llegaba al 16/11/2026.

## Tarjetas cripto

- **BingX Card.** Comisión oficial de transacción 1,50%. Cashback de la virtual, tramo 1: 2% si el gasto mensual es menor a US$ 200 (sube a 2,5% / 3%). Fuente: [Benefits and Fees, 23/07/2026](https://bingx.com/en/support/articles/16946861859471). LATAM está entre las regiones compatibles; el listado país por país no está publicado ([guía, 23/07/2026](https://bingx.com/es/support/articles/16946777309967)). El dueño del sitio informa 2% de cashback, 1,5% de comisión y que no se suman impuestos argentinos al pagar desde Argentina; eso se muestra como dato informado, no como verificación nuestra. El comparador pide contrastar condiciones en la app.
- **Binance Card Argentina.** Existe para residentes y el plástico lo emite Pomelo, según [Infobae, 17/09/2026](https://www.infobae.com/economia/networking/2026/09/17/binance-lanzo-su-tarjeta-fisica-en-argentina/). La [FAQ oficial de comisiones](https://www.binance.com/en/support/faq/detail/2a32d3668e704413b47fbf515ee38d6e) no se pudo leer completa (desafío anti-bot); no se publica en el sitio una comisión inventada.
- **Binance Card — dato del dueño del sitio** (18/11/2026), no es una verificación nuestra: 3% de cashback instantáneo hasta el 31/12/2026; no se aplica la percepción del 30% (RG 5617). IVA: sin confirmar. El comparador suma IVA 21% por defecto (estimación conservadora) y deja un interruptor para apagarlo. Según condiciones vigentes, hay que verificarlo en la app. Infobae (17/09/2026) también mencionó un reintegro de 3% en USDC hasta el 31/12/2026 (tope 100 USDC/mes) y el dicho de Binance de que esos pagos no estarían alcanzados por la percepción del 30%; eso es prensa, no una norma que hayamos contrastado.
- **Binance — referido.** El dueño del sitio aportó un [link general de registro](https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=es-LA&ref=GRO_28502_9GVXD&utm_source=referral_entrance). No hay un referido específico de la Card. El CTA lo aclara.
- **MEXC Global Card: no se incluye en el sitio.** El 18/11/2026 MEXC publicó que el servicio se discontinúa ese mismo día a las 15:30 UTC. Anuncio: [MEXC Global Card Service Discontinuation Notice](https://www.mexc.com/announcements/article/mexc-global-card-service-discontinuation-notice-17827791539800).

## Paleta (inspiración, sin assets)

Relevada el 18/11/2026 en [rockstargames.com/VI](https://www.rockstargames.com/VI) y [ /VI/music](https://www.rockstargames.com/VI/music), a partir de las hojas CSS del sitio (no se copiaron logos, arte ni la tipografía propietaria GTAArtDeco):

- Fondos: `#0d0c1a`, `#111117`, `#151732`, `#1e1728`
- Rosa / magenta: `#f976b0`, `#e963c7`, `#f4717c`
- Oro: `#ffdf80`
- Lavanda / cielo: `#9b89f5`, `#99ccff`
- Gradientes típicos: `linear-gradient(189deg, #4d203e 0%, #3e1a37 30%, #321532 65%, #251229 100%)` y variantes navy/púrpura

En el sitio se usan fuentes libres (Big Shoulders Display y Figtree) con una estética art-déco condensada, no la fuente de Rockstar.

## Privacidad y estadísticas

El sitio cuenta visitas y clics con un Worker propio de Cloudflare (`analytics-worker/`, base D1 `gta6-analytics`). Se guarda solo: tipo de evento, ruta (sin parámetros), dominio de referencia, país (encabezado de Cloudflare), tipo de dispositivo (móvil/tablet/escritorio) y fecha y hora. No se guardan IPs, user agents, cookies ni identificadores, y se respeta Do Not Track. El panel `stats.html` está protegido con una clave que no está en el repo.

## La jodita, membresías y Desafío PC (relevado 18/11/2026)

| Dato | Valor | Fuente |
| --- | --- | --- |
| PS5 Slim Digital bundle (Astro Bot + GT7) | ARS 1.899.999 (vendido por Frávega), ~11:15 hora Argentina | [Frávega, consolas PS5](https://www.fravega.com/l/videojuegos/consolas/?tipo-de-consola=ps5) |
| PS5 Slim Standard bundle (Astro Bot + GT7) | ARS 1.999.999 (vendido por Frávega) | Misma página |
| PS5 Pro Digital | ARS 2.859.999 (vendido por Sony, tienda oficial en Frávega) | Misma página |
| Xbox Series S 512 GB | ARS 1.294.000 | [Game Sense](https://gamesenseargentina.com/productos/consola-xbox-microsoft-series-s-de-512gb-digital-color-blanco/) |
| Xbox Series X 1 TB | ARS 2.386.000 | [Game Sense](https://gamesenseargentina.com/productos/xbox-series-x-standard-1tb/) |
| Nota consolas | Sony y Microsoft no venden consolas directo en Argentina: son precios de referencia de tiendas (IVA incluido), editables. | — |
| PS Plus AR (USD, sin impuestos) | Essential 8,99 / 22,99 / 64,99 · Extra 13,49 / 37,99 / 107,99 · Deluxe 15,99 / 43,99 / 124,99 (1/3/12 meses). IVA 21%, sin el 30% (RG 5677/2025) | [playstation.com/es-ar/ps-plus](https://www.playstation.com/es-ar/ps-plus/) · [Essential 1 mes](https://store.playstation.com/es-ar/product/IP9101-PPSA06916_00-PLUS1T01M0000000) · [Essential 12 meses](https://store.playstation.com/es-ar/product/IP9101-PPSA06916_00-PLUS1T12M0000000) |
| Game Pass AR (ARS/mes) | Essential 8.999 · Premium 11.999 · Ultimate 18.999 · PC Game Pass 13.999. Si incluye IVA: sin confirmar; el sitio lo suma por defecto (interruptor) | [xbox.com/es-AR/xbox-game-pass](https://www.xbox.com/es-AR/xbox-game-pass) |
| GTA VI y membresías | Campaña para un jugador; no está en PS Plus ni Game Pass; no hace falta membresía para la campaña | Rockstar / tiendas oficiales |
| Xbox Cloud | GTA VI disponible desde el día 1 comprándolo aparte | [Xbox Wire, 10/11/2026](https://news.xbox.com/en-us/2026/11/10/grand-theft-auto-6-comes-to-xbox-cloud-gaming-november-19/) |
| PC | Sin fecha oficial. “2027” es rumor: el sitio nunca lo muestra como dato | — |
| RTX 5060 8 GB (referencia) | ARS 979.999 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-gigabyte-nvidia-geforce-rtx-5060-8gb-windforce-2-max-oc.html) |
| RTX 5070 12 GB (referencia) | ARS 1.789.650 | [FullH4rd](https://fullh4rd.com.ar/prod/30259/placa-de-video-geforce-rtx-5070-12gb-gigabyte-gaming-oc) |
| Precio sugerido NVIDIA | RTX 5060 US$ 299 · RTX 5070 US$ 549 | NVIDIA |

Reglas de cálculo de La jodita:
- **Digital del exterior** (juego, upgrade, membresías): tarjeta del banco = oficial venta + IVA 21% (+IIBB si lo cargás), sin el 30%. Tarjeta cripto = USD × (1 + comisión − cashback) × dólar de fondeo elegido; Binance suma IVA si el interruptor está prendido.
- **Compra local en pesos** (consola, tele, otros): el precio ya trae IVA; sin impuestos de compra en el exterior. Con tarjeta cripto se aproxima la conversión de la red al oficial y se paga con USDT al dólar de fondeo: en general sale más caro que la tarjeta del banco. El ahorro usa la tarjeta cripto solo donde conviene.
- “Si ese ahorro lo ponés en Take-Two”: ahorro / dólar MEP, comprado al cierre de la fecha de compra de la calculadora, valuado a la última cotización.
- Desafío PC y Consola vs PC: resultado real con cierres diarios de TTWO; escenarios ×2, +50%, +30%, igual, −30%, −50% son hipotéticos. Metas en pesos se pasan a USD al MEP.

## Encuesta

Votos en la misma base D1 del Worker (`POST /poll`, `GET /poll/results`). Se guarda: opción, fecha y país. Sin IPs ni cookies; un voto por navegador (localStorage) y límite de ritmo nativo de Cloudflare (la clave no se guarda).

## Cuotas y precios por tienda (verificado 18/11/2026, hora Argentina)

| Tienda / producto | Precio | Cuotas | Fuente |
| --- | --- | --- | --- |
| Cetrogar · PS5 Slim Digital Bundle (GT7 + Astro Bot) | ARS 1.899.999 | Visa/Mastercard hasta 18 sin interés (CFT 0%): 18 × 105.555,50 · 12 × 158.333,25 · 6 × 316.666,50. Naranja 6/9/12/18 s/i; Amex/Sol hasta 12; Cabal/Tuya hasta 9 | [Cetrogar](https://www.cetrogar.com.ar/consola-playstation-ps5-digital-bundle-gt7---astrobot-825gb-el3034/p) |
| Cetrogar · PS5 Slim Standard Bundle | ARS 2.099.999 | Mismos planes: 18 × 116.666,61 · 12 × 174.999,91 | [Cetrogar](https://www.cetrogar.com.ar/consola-ps5-playstation-standard-bundle-gt7-astrobot-el3000/p) |
| Frávega (vende Frávega) · PS5 Digital / Standard | ARS 1.899.999 / 1.999.999 | Banco Provincia 6 cuotas sin interés en todo el sitio (si aplica en el checkout) | [Promociones bancarias](https://www.fravega.com/promociones/bancarias) |
| Tienda oficial Sony en Frávega · PS5 Slim Digital / Pro | ARS 1.869.999 / 2.859.999 | Cuotas no confirmadas | [Frávega PS5](https://www.fravega.com/l/videojuegos/consolas/?tipo-de-consola=ps5) |
| Frávega · GTA VI PS5 caja con código | ARS 219.999 | Según promos de la tienda | [Frávega](https://www.fravega.com/p/juego-ps5-grand-theft-auto-vi-formato-fisico-con-codigo-342114/) |
| Game Sense · Xbox Series S 512 GB / Series X 1 TB | ARS 1.294.000 / 2.386.000 | Mercado Pago: solo 1 pago sin interés (6 y 12 cuotas con recargo). Efectivo −20% (S ARS 1.035.200 · X ARS 1.908.800); transferencia −10% | [Series S](https://gamesenseargentina.com/productos/consola-xbox-microsoft-series-s-de-512gb-digital-color-blanco/) · [Series X](https://gamesenseargentina.com/productos/xbox-series-x-standard-1tb/) |
| Game Sense · GTA VI Xbox caja | ARS 239.999 | — | [Game Sense](https://gamesenseargentina.com/) |
| PS Store (juego digital, upgrade, PS Plus) | USD + IVA | Sin cuotas: un solo pago | — |
| Game Pass | ARS mensual | Sin cuotas | — |
| Mercado Crédito “cuotas sin tarjeta” | — | Con interés (no es sin interés) | — |

La Digital de la tienda oficial Sony (ARS 1.869.999) no se usa como precio de referencia del bundle de Cetrogar/Frávega: no está confirmado que sea el mismo SKU (consola sola vs. bundle Astro Bot + GT7). Cuotas de esa ficha no confirmadas.

“Esperar hasta fin de noviembre (Black Friday)”: usa el precio de hoy como referencia; no se suponen descuentos.

## Imagen del Desafío PC

`assets/desafio-pc-*.{webp,jpg}`: imagen generada con IA (PC gamer neón, atardecer synthwave, palmeras; sin texto ni logos).
