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

El gráfico usa un **snapshot estático** de cierres diarios, compilado el 18/11/2026 (America/Buenos_Aires) desde la API de gráficos de Yahoo Finance y contrastado con las cotizaciones históricas de Nasdaq. El último cierre del corte es **US$ 203,93 el 17/11/2026** (coinciden ambas fuentes).

El sitio **no llama APIs en el navegador**. Yahoo y Nasdaq suelen restringir la redistribución comercial de datos de mercado: este archivo es un recorte ilustrativo, con atribución y fecha de corte, no un producto de datos.

Para actualizar el snapshot (en tu máquina):

```bash
python3 scripts/refresh-ttwo.py
```

## Pagos con tarjeta cripto

En “Cuánto pagás de verdad” se compara el total de la tienda (con los impuestos que el usuario tilde) contra pagar el precio de lista con la **BingX Card**. El 2% de cashback y el 1,5% de comisión se muestran como dato informado por el dueño del sitio, alineado con la tarifa oficial de transacción de 1,50% y el cashback del tramo inicial; hay que verificarlo en la app.

El enlace “Págalo con la BingX card” es de referido. La Binance Card queda como placeholder hasta tener el link.

## Placeholders y huecos

- Link de referido de Binance: todavía no está.
- Precios de DLC de historia o add-ons pagos de GTA 6: no publicados al 18/11/2026. El usuario puede cargarlos a mano.
- Precio físico en cadenas argentinas: no verificado.
- Versión de PC al lanzamiento: no publicada.
- Alícuota de Ingresos Brutos: no hay una única nacional; queda en 0 para que cada quien complete la de su provincia.

## Licencia

MIT. Ver `LICENSE`.
