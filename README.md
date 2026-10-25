# Loli's Küche

Página de pedidos de **Loli's Küche**, salchichas alemanas con receta de familia, con domicilios
solo en Bogotá. Publicada en **https://loliskuche.com** (Cloudflare Pages, proyecto `loliskuche`;
también responde en loliskuche.pages.dev). Las etiquetas canonical, Open Graph, el JSON-LD,
`sitemap.xml` y `robots.txt` usan `https://loliskuche.com/`.

## Carpetas

```
index.html                  La página (inicio, historia, menú, pedido, preguntas, contacto)
css/styles.css              Estilos: colores y fuentes en las variables de :root
js/main.js                  Menú, barra inferior, pedido, mensaje de WhatsApp y movimientos
img/marca/                  Logo, ícono del menú, ícono de la pestaña e imagen para compartir
img/historia/               Retrato del abuelo Loli
img/salchichas/             Una foto por salchicha (360 y 720 px en WebP; .jpg para Google)
sitemap.xml, robots.txt     Para Google
_headers                    Caché y seguridad en Cloudflare Pages
google3946fe4c509c6b46.html Verificación de Google Search Console (no borrar)
```

`index.html` y los archivos de Google deben quedarse en la raíz.

## Cómo actualizar la página publicada

1. Descarga este repositorio: botón verde **Code → Download ZIP**, y descomprímelo.
2. En Cloudflare entra a **Workers & Pages → loliskuche → Create deployment**.
3. Arrastra la carpeta (con `index.html` adentro, sin la carpeta `.git`) y toca **Save and Deploy**.

## Cambios frecuentes

- **Precio o descripción:** en `index.html`, en la tarjeta de la salchicha (`data-price` y el
  texto) y también en el bloque `application/ld+json` del inicio, que lee Google.
- **Salchicha agotada:** clase `item--unavailable`, botones con `disabled` y en el JSON-LD
  `"availability": "https://schema.org/OutOfStock"`. Así está la Merguez.
- **Foto nueva:** guárdala en `img/salchichas/` en tres tamaños (`nombre-360.webp`,
  `nombre.webp` de 720 px y `nombre.jpg`) y reemplaza el recuadro `item__photo--empty`
  por la imagen, como en las demás salchichas.
- **Número de WhatsApp:** `WHATSAPP_NUMBER` en `js/main.js` y los enlaces `wa.me` de `index.html`.
