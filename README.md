# 🔥 Parrillómetro

**Calcula cuánta comida y bebida comprar para tu barbacoa.** Que no falte de nada y que no sobre medio kilo de morcilla.

Respondes unas preguntas sencillas (cuántos sois, cuánto dura, qué apetito hay, si son más de cerveza o de vino, qué tiempo hará y qué tipo de parrilla quieres) y la app te da la lista de la compra redondeada a lo que de verdad venden en el súper: packs de 24 latas, bandejas de 4 hamburguesas, sacos de carbón…

Nació de una hoja de Excel usada en barbacoas reales y se ha convertido en una web que cualquiera puede usar desde el móvil, sin instalar nada ni registrarse.

## Qué hace

- **Invitados por tipo**: adultos, adolescentes y niños comen y beben distinto. También cuenta a los vegetarianos.
- **Preguntas en lenguaje normal**: *"¿Cuánto beben?" → Tranquilos · Normal · De celebración · Fiestas del pueblo.*
- **Mezcla cerveza / vino** con un deslizador.
- **Propuesta de carne con criterio de asador**: eliges presupuesto, estilo y extras, y la app arma el menú por papeles: un plato principal (chuletón, cordero, ibérico…) que se lleva la mitad de la carne, secundarios y picoteo. Tiene en cuenta el hueso y la merma de cada corte, el tamaño del grupo, los niños y la duración.
- **Tú mandas**: marca con la estrella otro plato principal o quítalo, y quita o añade cortes de un catálogo de 25; los kilos se reparten solos.
- **Acompañamientos de temporada**: patatas, pimientos, escalivada, setas, mazorcas… propuestos según el estilo y la época del año (se deduce de la fecha de la barbacoa). Con dos o más de brasa, la carne baja un 10 %.
- **Aperitivo, salsas y carbón** calculados según el menú (alioli, chimichurri si hay vacuno, salsas americanas…).
- **Lista con formato ticket**, agrupada por secciones del súper, con coste estimado total y por adulto.
- **Comparar precios**: toca una línea para ajustar su precio o abrir la búsqueda de ese producto en Mercadona, Carrefour, Alcampo, Amazon Fresh o Dia.
- **Aviso de exceso**: si las respuestas dan más de 10 consumiciones por adulto (fiestas del pueblo + hasta que nos echen), la lista lo advierte.
- **Copiar, enviar por WhatsApp o imprimir** la lista.
- **Mis barbacoas**: guarda las barbacoas que configuras (con nombre, fecha y notas de qué sobró o faltó) en un histórico para abrirlas, ajustarlas y reutilizarlas.
- **Privacidad**: todo se guarda solo en tu navegador; nada sale de tu dispositivo. La barbacoa en curso y el historial se conservan hasta que tú los borres con los botones de la app.

## Usarla

Abre la web publicada en GitHub Pages (ver más abajo) o descarga el repositorio y abre `index.html` en el navegador. No necesita servidor ni dependencias.

## Publicarla en GitHub Pages

1. Sube este repositorio a GitHub.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`. Guarda.
4. En un minuto estará en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

## Adaptarla a tu gusto

Todo lo que se puede ajustar está en **[`config.js`](config.js)**, comentado:

| Qué | Dónde | Valor por defecto |
|---|---|---|
| Carne cruda por adulto | `kgCarnePorAdulto` | 0,4 kg (tarde entera, apetito normal) |
| Cuánto comen adolescentes y niños | `factorComensal` | 75 % y 40 % de un adulto |
| Consumiciones con alcohol por adulto | `consumicionesBase` | 5 en una tarde normal |
| Refrescos, agua, hielo, pan, carbón… | ratios del principio | ver fichero |
| Multiplicadores de cada respuesta | `duracion`, `apetito`, `sed`, `tiempo`… | ver fichero |
| Propuestas de carne | `propuestas` y `extras` | 3 estilos × 3 presupuestos |
| Catálogo de productos, envases y precios | `productos` | precios orientativos |
| Tiendas para comparar | `tiendas` | Mercadona, Carrefour, Alcampo, Amazon Fresh, Dia |

Para añadir un corte nuevo: créalo en `productos`, añádelo a `carnes` con su categoría y su peso en el reparto, y (si quieres) inclúyelo en alguna propuesta.

## Cómo calcula

Las reglas están explicadas en el *Manual del Parrillómetro* (papeles, cantidades, catálogo de cortes y guarniciones). Resumen:

- **Comensales equivalentes** = adultos + 0,75 × adolescentes + 0,4 × niños (los vegetarianos se descuentan de la carne).
- **Carne** = comensales × 0,4 kg × apetito × duración (−10 % con dos o más guarniciones de brasa). Se reparte por papeles: con plato principal 50 % principal · 35 % secundarios · 15 % picoteo; sin él, 78 % secundarios · 22 % picoteo. Los niños no cuentan para el plato principal. Cada corte se ajusta por su rendimiento (hueso y merma) y se redondea al cuarto de kilo o al envase.
- **Alcohol** = adultos que beben × 5 consumiciones × sed × duración, repartido entre cerveza (1 lata de 33 cl) y vino (5 copas por botella).
- **Refrescos, agua y hielo** escalan con las personas, la duración y el calor.
- **Pan de hamburguesa, pan de perrito y queso** se calculan a partir de las unidades compradas.

Con los datos de la barbacoa original (23 adultos, 6 adolescentes y 12 niños) la app reproduce los resultados de la hoja: 12,92 kg de carne con la duración de referencia, 6 packs de cerveza, 5 botellas de vino y 10 barras de pan. Hay tests que lo comprueban.

## Sobre los precios

Los precios son **orientativos** y editables. La app no consulta las tiendas en directo: una web estática no puede hacerlo desde el navegador y la extracción automática de datos de los supermercados choca con sus condiciones de uso. Por eso cada producto enlaza al buscador de cada tienda para que compares tú en un clic.

## Desarrollo

```
index.html     la página
config.js      ratios, preguntas, catálogo y precios
calc.js        motor de cálculo (función pura, sin DOM)
app.js         interfaz
styles.css     estilos (modo claro y oscuro)
calc.test.js   tests del motor
```

Ejecuta los tests con Node 18 o superior:

```
npm test
```

## Aviso

Cálculos orientativos basados en consumos medios. Bebe con moderación y, si conduces, cero alcohol.

## Licencia

[MIT](LICENSE)
