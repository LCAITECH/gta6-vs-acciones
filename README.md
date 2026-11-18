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

El recuadro **TTWO ahora** muestra ese snapshot y la hora: “actualizado hh:mm (hora Argentina)”. Si el archivo no está, la calculadora cae al último cierre diario.


## Pagos con tarjeta cripto

En “Cuánto pagás de verdad” se compara el total de la tienda (con los impuestos que el usuario tilde) contra pagar el precio de lista con la **BingX Card**. El 2% de cashback y el 1,5% de comisión se muestran como dato informado por el dueño del sitio, alineado con la tarifa oficial de transacción de 1,50% y el cashback del tramo inicial; hay que verificarlo en la app.

El enlace “Págalo con la BingX card” es de referido de la tarjeta. El de “Págalo con la Binance Card” es un referido general de alta en Binance, no un referido específico de la Card.

## Placeholders y huecos

- Comisión de la Binance Card: no publicada / no verificada (no se inventa). El IVA en esa tarjeta está sin confirmar; el comparador lo suma por defecto y se puede apagar.
- Precios de DLC de historia o add-ons pagos de GTA 6: no publicados al 18/11/2026. El usuario puede cargarlos a mano.
- Precio físico en cadenas argentinas: no verificado.
- Versión de PC al lanzamiento: no publicada.
- Alícuota de Ingresos Brutos: no hay una única nacional; queda en 0 para que cada quien complete la de su provincia.

## Licencia

MIT. Ver `LICENSE`.
