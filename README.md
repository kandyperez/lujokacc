# Lujos — catálogo de productos

App web de catálogo con vista pública y panel de administración. Next.js 16 (App
Router) + SQLite, sin servicios externos.

## Arrancar

```bash
npm run dev
```

- Catálogo público: <http://localhost:3000>
- Panel: <http://localhost:3000/admin> (pide ingreso)

Credenciales de admin por defecto (hardcodeadas):

| Correo            | Contraseña |
| ----------------- | ---------- |
| `admin@lujos.com` | `admin123` |

Se pueden cambiar sin tocar el código con variables de entorno en `.env.local`:

```
ADMIN_EMAIL=tu@correo.com
ADMIN_PASSWORD=una-clave-larga
SESSION_SECRET=cadena-aleatoria-para-firmar-la-sesion
```

> En producción define `SESSION_SECRET`: la cookie de sesión se firma con HMAC y
> el valor por defecto es público.

## Modelo de datos

Un producto pertenece a **una sección** (nivel superior del catálogo) y lleva
**categoría**, **marca** y **tipo** como atributos opcionales. Las cuatro
taxonomías se crean, renombran y eliminan desde el panel.

```
sección  (General, Casa Comercial, …)   ← obligatoria, ordenable
└── producto  (nombre, descripción, imágenes)
      ├── categoría   (Iluminación, …)
      ├── marca       (Bosch, …)
      └── tipo        (Lujo, Calcomanía, …)
```

Una taxonomía en uso no se puede borrar, y siempre debe quedar al menos una
sección. Los nombres duplicados se detectan ignorando mayúsculas y tildes
("Iluminación" e "iluminacion" son el mismo registro).

## Dónde vive todo

| Ruta                       | Qué es                                            |
| -------------------------- | ------------------------------------------------- |
| `/`                        | Catálogo público, agrupado por sección            |
| `/producto/[slug]`         | Ficha con galería de imágenes                     |
| `/login`                   | Ingreso de administrador                          |
| `/admin`                   | Resumen                                           |
| `/admin/productos`         | Alta, edición, publicar/ocultar y borrado         |
| `/admin/taxonomias`        | Secciones, categorías, marcas y tipos             |
| `/api/uploads/[filename]`  | Sirve las imágenes subidas                        |

Código:

- `src/lib/db.ts` — conexión SQLite (`node:sqlite`, sin dependencias nativas),
  esquema y datos iniciales.
- `src/lib/queries.ts` — lecturas (catálogo, filtros, panel).
- `src/app/actions/` — Server Actions de escritura; **cada una** verifica la
  sesión, porque son alcanzables por POST directo.
- `src/lib/uploads.ts` — validación y guardado de imágenes.

## Datos y respaldos

Todo lo generado vive en `data/` (ignorado por git):

```
data/catalogo.db    base SQLite
data/uploads/       imágenes subidas
```

Respaldar el catálogo es copiar esa carpeta. Borrarla reinicia la app con las
secciones (General, Casa Comercial) y tipos (Lujo, Calcomanía) por defecto.

Las imágenes no se guardan en `public/` a propósito: los archivos añadidos ahí
después del build no se sirven. Se entregan por un route handler que sólo acepta
nombres generados por la app (uuid + extensión conocida), así que no hay forma de
pedir una ruta arbitraria.

Límites de subida: 8 imágenes por producto, 5 MB cada una, en jpg/png/webp/gif/avif.

## Comandos

```bash
npm run dev     # desarrollo
npm run build   # build de producción
npm start       # servir el build
npm run lint    # eslint
```
