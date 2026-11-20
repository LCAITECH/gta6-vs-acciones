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

Un workflow de GitHub Actions (`refresh-ttwo.yml`) corre una vez por día hábil, ya cerrada la rueda de Nasdaq (22:37 UTC), con un segundo intento unas horas después. Trae el dato en el servidor, lo guarda en el JSON y hace commit. También se puede disparar a mano (`workflow_dispatch`) o correr `python3 scripts/refresh-ttwo.py` en local (`--quote` para solo la cotización).

El **histórico diario** (`data/ttwo-daily.json`) se reescribe completo en cada corrida programada con los cierres oficiales (Yahoo cruzado con Nasdaq) y nunca guarda el precio parcial de una rueda abierta. Con `--quote`, que es lo que corre una ejecución manual sin `history`, se suma al histórico la rueda que acaba de cerrar. Para forzar la actualización completa: `gh workflow run refresh-ttwo.yml -f history=true`.

El recuadro **TTWO último dato** muestra la última cotización guardada y su hora: “actualizado hh:mm (hora Argentina)”. Como se refresca una vez por día, normalmente es el último cierre. Si el archivo no está, la calculadora cae al último cierre diario.

Lo mismo para **bitcoin (BTC/USD)**: `scripts/refresh-btc.py` (GitHub Action dos veces por día) escribe `data/btc-latest.json` y `data/btc-daily.json` desde la API pública de Bitstamp. El sitio no llama a Bitstamp en el cliente. Coinbase no se usó (sus términos de market data no permiten mostrar esos datos a terceros sin consentimiento). Ver `FUENTES.md`.


## Cuándo se actualizan los datos

El sitio trabaja con **cierres diarios**, así que alcanza con refrescar los datos una vez por día después de cada cierre. Los refrescos corren en GitHub Actions con `schedule`, que es "best effort": GitHub puede demorar o saltear una corrida (el 19/11/2026 el cron de TTWO, que estaba configurado cada 15 minutos, casi no corrió). Por eso la cuenta no depende de que cada corrida salga: el histórico se reescribe completo cada vez, y un día salteado se recupera solo en la próxima corrida que sí salga. Horarios (UTC):

| Workflow | Cuándo |
|---|---|
| TTWO (cierres oficiales y última cotización) | lunes a viernes 22:37, con un segundo intento a las 02:17 del día siguiente |
| Dólar | días hábiles 14:11, 17:11 y 20:11, y todos los días 06:11 |
| BTC | todos los días 00:41 y 12:41 |
| Hardware | todos los días 12:47 |

Los minutos están corridos a propósito (:37, :11, :41…) para evitar el comienzo de cada hora, que según la documentación de GitHub es cuando más carga tiene. Todos se pueden disparar a mano desde la pestaña Actions o con `gh workflow run <archivo>.yml`; el de TTWO acepta `-f history=true` para forzar la actualización completa.

## Cotizaciones en Argentina

`data/fx-ar.json` se actualiza tres veces por día hábil (11:11, 14:11 y 17:11 hora Argentina) y una vez de noche (GitHub Actions + `scripts/refresh-fx.py`) con oficial, tarjeta, blue, MEP, CCL y cripto, desde [DolarApi](https://dolarapi.com) ([uso de los datos](https://dolarapi.com/docs/uso); hay que citar “DolarApi https://dolarapi.com”). El comparador “tarjeta cripto vs tarjeta bancaria” convierte a pesos: el banco usa oficial venta + IVA 21% (sin el 30% de percepción, porque PSN, Microsoft y Rockstar están excluidos). La cripto se fondea al dólar que elijas (cripto/USDT por defecto) + comisión − cashback.

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
- **Desafío Gordo Compu** (`#desafio`): sub-pestañas Comparar / Armar PC / Meta y simulación / Encuesta. Comparador placa vs consola (ARS, USD al MEP y acciones TTWO) a partir de `data/hardware-prices.json` (refresco automático una vez por día, no es un tick en vivo). Armador con presets, chequeo de socket/RAM, totales, y gabinete 3D (CSS, se carga al abrir Armar). Sub-pestaña Metas: objetivo (PC nueva / placa / RAM / procesador) del catálogo verificado, plazo en meses y fecha (solo aportes y con supuesto de TTWO, BTC o mitad y mitad), barra de avance, escenarios (aporte ×2/×3, baja del componente, variación del activo) y celebración si ya llegaste. Simulador de proyección con horizonte de 1 a 12 meses y selector de activo (TTWO / BTC / mitad y mitad). Encuesta en vivo (barras cada ~30 s) también en esta vista.
- **Consola hoy vs esperar la PC**: misma lógica, con una fecha de PC elegida por el usuario (no hay fecha oficial) o un modo “esperar a fin de noviembre (Black Friday)” que muestra el mejor precio verificado de hoy, sin inventar descuentos.
- **Encuesta**: votos en D1 vía el Worker de analítica; barras en vivo también en el Desafío.
- **Lo oficial** (`#oficial`): tráileres oficiales de Rockstar Games incrustados desde su canal de YouTube (se piden recién al tocar «Ver», con `youtube-nocookie.com`) y links a su sitio. No se aloja ni se copia nada de Rockstar, y los links no son de referido. Los IDs de video están en `oficial.js`, verificados contra el feed público del canal. Además enlaza (sin alojar nada) al póster oficial «Mapa de Leónida», que Rockstar publica para descargar en su galería de arte, y a su página de música. No hay un mapa interactivo oficial: los interactivos que existen son de fans.
