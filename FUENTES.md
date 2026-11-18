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

## La jodita, membresías y Desafío Gordo Compu (relevado 18/11/2026)

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
- Desafío Gordo Compu y Consola vs PC: resultado real con cierres diarios de TTWO; escenarios ×2, +50%, +30%, igual, −30%, −50% son hipotéticos. Metas en pesos se pasan a USD al MEP.

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

## Imagen del Desafío Gordo Compu

`assets/desafio-pc-*.{webp,jpg}`: imagen generada con IA (PC gamer neón, atardecer synthwave, palmeras; sin texto ni logos).


## Precios de hardware (Desafío Gordo Compu)

Snapshot armado el 18/11/2026 12:39 (hora Argentina, `America/Buenos_Aires`). Fuente principal: fichas públicas de [Venex](https://www.venex.com.ar). El comparador **no es un tick en vivo**: `scripts/refresh-hardware.py` (GitHub Action cada ~6 h) intenta releer cada URL. Si una tienda no responde, se conserva el último valor verificado con su fecha (`status: stale`).

No se usa Mercado Libre: `api.mercadolibre.com` declara `Disallow: /` y la API anónima responde 403.

| Componente | Producto | Precio (ARS) | Tienda | Fecha | Ficha |
| --- | --- | --- | --- | --- | --- |
| RTX 4060 8 GB | Placa de Video Gigabyte NVIDIA GeForce RTX 4060 Aero OC 8GB GDDR6 | ARS 633.789 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-gigabyte-nvidia-geforce-rtx-4060-aero-oc-8gb-gddr6.html) |
| RTX 5060 8 GB | Placa de Video ASUS Prime NVIDIA GeForce RTX 5060 OC 8GB GDDR7 | ARS 694.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-asus-prime-nvidia-geforce-rtx-5060-oc-8gb-gddr7.html) |
| RTX 5060 Ti 8 GB | Placa de Video Gigabyte NVIDIA GeForce RTX 5060 Ti 8GB AERO OC | ARS 879.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-gigabyte-nvidia-geforce-rtx-5060-ti-aero-8gb.html) |
| RTX 5060 Ti 16 GB | Placa de Video Palit NVIDIA GeForce RTX 5060 Ti 16GB Infinity 3 OC | ARS 994.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-palit-nvidia-geforce-rtx-5060-ti-infinity-3-oc-16gb-gddr7.html) |
| RTX 5070 12 GB | Placa de Video Palit NVIDIA GeForce RTX 5070 Infinity 3 12GB GDDR7 | ARS 1.599.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-palit-nvidia-geforce-rtx-5070-infinity-3-12gb-gddr7.html) |
| RTX 5070 12 GB | Placa de video GeForce RTX 5070 12GB Gigabyte Gaming OC | ARS 1.789.650 | FullH4rd | 18/11/2026 | [FullH4rd](https://fullh4rd.com.ar/prod/30259/placa-de-video-geforce-rtx-5070-12gb-gigabyte-gaming-oc) |
| RTX 5070 Ti 16 GB | Placa de Video Gigabyte NVIDIA GeForce RTX 5070 Ti 16GB Eagle OC | ARS 2.319.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-gigabyte-nvidia-geforce-rtx-5070-ti-16gb-eagle-oc.html) |
| RTX 5080 16 GB | Placa de Video Palit NVIDIA GeForce RTX 5080 16GB Infinity 3 | ARS 3.099.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-palit-nvidia-geforce-rtx-5080-16gb-infinity-3.html) |
| RX 7600 8 GB | Placa de Video ASRock AMD Radeon RX 7600 8GB Challenger OC | ARS 547.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-asrock-amd-radeon-rx-7600-challenger-8gb-oc.html) |
| RX 9060 8 GB | Placa de Video ASRock AMD Radeon RX 9060 8GB Challenger | ARS 668.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-asrock-amd-radeon-rx-9060-challenger-8gb.html) |
| RX 9060 XT 8 GB | Placa de Video ASUS Prime AMD Radeon RX 9060 XT 8GB OC | ARS 784.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-asus-amd-radeon-rx-9060-xt-prime-oc-8gb.html) |
| RX 9060 XT 16 GB | Placa de Video ASRock AMD Radeon RX 9060 XT 16GB Challenger OC | ARS 929.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-asrock-amd-radeon-rx-9060-xt-challenger-16gb-oc.html) |
| RX 9070 16 GB | Placa de Video Gigabyte AMD Radeon RX 9070 16GB Gaming OC | ARS 1.509.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-gigabyte-amd-radeon-9070-gaming-oc-15gb.html) |
| RX 9070 XT 16 GB | Placa de Video PowerColor AMD Radeon RX 9070 XT Reaper 16GB GDDR6 | ARS 1.473.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/placas-de-video/placa-de-video-powercolor-amd-radeon-rx-9070-xt-reaper-16gb-gddr6.html) |
| Ryzen 5 5500 | Procesador AMD Ryzen 5 5500 6/12 4.2GHz AM4 Sin Video | ARS 172.299 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-cpu-amd-ryzen-5-5500-6-12-4-2ghz-zen3-am4.html) |
| Ryzen 5 5600 | Procesador AMD Ryzen 5 5600 6/12 4.4GHz AM4 Sin Video | ARS 247.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-cpu-amd-ryzen-5-5600-6-12-zen3.html) |
| Ryzen 7 5700 | Procesador AMD Ryzen 7 5700 8/16 4.6GHz AM4 Sin Video | ARS 239.500 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-cpu-amd-ryzen-7-5700-8-16-4-6ghz-s-g-zen3-am4.html) |
| Ryzen 5 8400F | Procesador AMD Ryzen 5 8400F 6/12 4.7GHz AM5 Sin Video | ARS 269.500 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-amd-ryzen-5-8400f-6-12-4-7ghz-am5.html) |
| Ryzen 5 8600G | Procesador AMD Ryzen 5 8600G 6/12 5.0GHz AM5 | ARS 298.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-cpu-amd-ryzen-5-8600g-6-12-5ghz-am5.html) |
| Core i3-12100F | Procesador Intel Core i3 12100F 4/8 4.3GHz LGA1700 Sin Video | ARS 149.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-intel-core-i3-12100f-alderlake-4-3ghz-4-8-12mb-lga1700-s-video.html) |
| Core i5-12400F | Procesador Intel Core i5 12400F 6/12 4.4GHz LGA1700 Sin Video | ARS 279.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-intel-core-i5-12400f-alderlake-4-40ghz-12mb-lga1700.html) |
| Core i5-14400F | Procesador Intel Core i5 14400F 10/16 4.7GHz LGA1700 Sin Video | ARS 334.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/microprocesadores/microprocesador-core-i5-14400f-raptorlake-10-16-4-7ghz-20mb-s1700.html) |
| DDR4 8 GB 3200 | Memoria RAM G.Skill DDR4 8GB 3200MHz CL22 Bulk | ARS 109.500 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/memorias-ram/desktop/memoria-ram-ddr4-8gb-3200mhz-gskill-oem-bulk-cl22.html) |
| DDR4 16 GB 3200 | Memoria RAM Kingdian Heat H41 DDR4 16GB 3200MHz | ARS 216.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/memorias-ram/desktop/memoria-ram-kingdian-heat-h41-ddr4-16gb-3200mhz.html) |
| DDR4 32 GB 3200 (2×16) ×2 | 2 × Memoria RAM Kingdian Heat H41 DDR4 16GB 3200MHz | ARS 433.980 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/memorias-ram/desktop/memoria-ram-kingdian-heat-h41-ddr4-16gb-3200mhz.html) |
| DDR5 16 GB 5600 | Memoria RAM Hiksemi Hiker DDR5 16GB 5600MHz | ARS 457.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/memorias-ram/desktop/memoria-ram-hiksemi-hiker-16gb-5600mhz.html) |
| DDR5 16 GB 6000 | Memoria RAM Corsair Vengeance DDR5 16GB 6000MHz CL38 | ARS 473.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/memorias-ram/desktop/memoria-ram-corsair-vengeance-ddr5-16gb-6000mhz-cl38.html) |
| DDR5 32 GB 5600 (2×16) ×2 | 2 × Memoria RAM Hiksemi Hiker DDR5 16GB 5600MHz | ARS 915.980 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/memorias-ram/desktop/memoria-ram-hiksemi-hiker-16gb-5600mhz.html) |
| MSI A520M-A PRO | Motherboard MSI A520M-A PRO AMD A520 AM4 DDR4 | ARS 80.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/motherboards/amd/motherboard-msi-a520m-a-pro-am4-ddr4.html) |
| MSI PRO B550M-B | Motherboard MSI PRO B550M-B AM4 DDR4 | ARS 123.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/motherboards/amd/motherboard-msi-pro-b550m-b-am4-ddr4.html) |
| ASUS Prime A620M-K | Motherboard ASUS Prime A620M-K AM5 DDR5 | ARS 122.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/motherboards/amd/motherboard-asus-prime-a620m-k-ddr5-am5.html) |
| MSI PRO B650M-B | Motherboard MSI PRO B650M-B AM5 DDR5 | ARS 140.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/motherboards/amd/motherboard-msi-pro-b650m-b-am5-ddr5.html) |
| MSI PRO H610M-S DDR4 | Motherboard MSI Pro H610m-S LGA1700 DDR4 | ARS 109.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/motherboards/intel/motherboard-msi-pro-h610m-s-ddr4-box-s1700.html) |
| MSI PRO H610M-G DDR5 | Motherboard MSI Pro H610M-G LGA1700 DDR5 | ARS 106.999 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/motherboards/intel/motherboard-msi-pro-h610m-g-ddr5-lga1700.html) |
| MSI MAG 550W 80+ Bronze | Fuente MSI MAG 550W A550BN 80+ Bronze | ARS 72.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/fuentes/fuente-msi-mag-550w-a550bn-80-bronze.html) |
| Raptor 750W 80+ Bronze | Fuente Raptor 750W 80 Plus Bronze Volt | ARS 68.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/fuentes/fuente-raptor-750w-volt-80-bronze.html) |
| Kingston NV3 500 GB NVMe | Disco sólido SSD Kingston NV3 500GB M.2 NVMe PCIe 4.0 5000MB/s | ARS 184.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/discos-solidos-ssd/disco-de-estado-solido-ssd-500gb-kingston-m2-nvme-2280-nv3-5000mb-s.html) |
| Kingston NV3 1 TB NVMe | Disco sólido SSD Kingston NV3 1TB M.2 NVMe PCIe 4.0 6000MB/s | ARS 268.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/discos-solidos-ssd/ssd-1tb-kingston-m2-nvme-2280-nv3-6000mb-s.html) |
| Gamemax Nova N5 RGB | Gabinete Gamemax Nova N5 RGB Mid Tower ATX | ARS 40.990 | Venex | 18/11/2026 12:39 | [Venex](https://www.venex.com.ar/componentes-de-pc/gabinetes/gabinete-gamemax-nova-n5-mid-tower-atx-rgb.html) |
| PS5 Slim Digital (bundle Astro Bot + GT7) | PlayStation 5 Slim Digital Bundle GT7 + Astro Bot | ARS 1.899.999 | Cetrogar | 18/11/2026 ~11:15 | [Cetrogar](https://www.cetrogar.com.ar/consola-playstation-ps5-digital-bundle-gt7---astrobot-825gb-el3034/p) |
| PS5 Slim Standard con lectora (bundle Astro Bot + GT7) | PlayStation 5 Slim Standard Bundle GT7 + Astro Bot | ARS 1.999.999 | Frávega | 18/11/2026 ~11:15 | [Frávega](https://www.fravega.com/promociones/bancarias) |
| PS5 Pro Digital | PlayStation 5 Pro Digital | ARS 2.859.999 | Tienda oficial Sony en Frávega | 18/11/2026 ~11:15 | [Tienda oficial Sony en Frávega](https://www.fravega.com/l/videojuegos/consolas/?tipo-de-consola=ps5) |
| Xbox Series S 512 GB | Xbox Series S 512 GB | ARS 1.294.000 · efectivo ARS 1.035.200 | Game Sense | 18/11/2026 ~11:15 | [Game Sense](https://gamesenseargentina.com/productos/consola-xbox-microsoft-series-s-de-512gb-digital-color-blanco/) |
| Xbox Series X 1 TB | Xbox Series X 1 TB | ARS 2.386.000 · efectivo ARS 1.908.800 | Game Sense | 18/11/2026 ~11:15 | [Game Sense](https://gamesenseargentina.com/productos/xbox-series-x-standard-1tb/) |

Notas:
- RAM de 32 GB: no había un kit de 32 GB en las páginas 1–2 de memorias desktop de Venex; el precio es 2 × el módulo de 16 GB de la misma ficha.
- RTX 5070 FullH4rd (Gigabyte Gaming OC, ARS 1.789.650): último valor verificado el 18/11/2026. En este entorno el sitio respondió 403; queda como referencia hasta que el refresco pueda leerla. En Venex hay una 5070 más barata el mismo día (Palit Infinity 3, ARS 1.599.990).
- Consolas: mismos precios ya citados más arriba (Cetrogar / Frávega / Game Sense, 18/11/2026 ~11:15). El comparador usa efectivo en Series S/X cuando está publicado.
- Metas fijas del desafío (RTX 5060 Gigabyte Windforce 2 Max OC ARS 979.999 en Venex y RTX 5070 FullH4rd) se mantienen como referencias anteriores; el catálogo muestra además el SKU más barato verificado de cada clase.

Cambio peso/dólar del comparador y del armador: MEP (bolsa venta) de `data/fx-ar.json` (DolarApi https://dolarapi.com). Acciones: último precio de `data/ttwo-latest.json`.

## Rendimiento por consola (¿Me conviene?)

Fuente principal, verificada el 18/11/2026 (hora Argentina):

- [Digital Foundry — “GTA 6: PS5 vs PS5 Pro, Xbox Series X and Series S: Which Console Plays Best?”, Oliver Mackenzie, 18/11/2026](https://www.digitalfoundry.net/features/gta-6-ps5-vs-ps5-pro-xbox-series-x-and-series-s-which-console-plays-best). Resolución (PS5 / Pro / Series X: 1440p → 4K; Series S: 720p → ~1080p), upscalers (PSSR en Pro, TAA espacial de Rockstar en Slim y Series X, FSR 4 en Series S), objetivo de 30 fps sin modo 40/60, y las mediciones de estabilidad citadas en la tabla.
- [Digital Foundry — “You Can Play GTA 6 on Xbox One”, William Judd, 10/11/2026](https://www.digitalfoundry.net/news/2026/11/you-can-play-gta-6-on-xbox-one), citando a Rockstar: en Xbox One solo hay Xbox Cloud Gaming, con ajustes de Series S; la conexión puede afectar el stream. Al 18/11/2026 DF no había publicado un test del stream.
- PC: sin versión anunciada ni fecha oficial (el “2027” es rumor; no se da por hecho).

Los precios en ARS de esa tabla son los mismos de “Cuotas y precios por tienda”, no de Digital Foundry.
