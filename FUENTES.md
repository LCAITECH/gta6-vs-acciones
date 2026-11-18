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
