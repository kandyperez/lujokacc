import "server-only";

import { DatabaseSync } from "node:sqlite";

import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");

const DB_FILE = path.join(DATA_DIR, "catalogo.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sections (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brands (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_types (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  section_id  INTEGER NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
  category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id    INTEGER REFERENCES brands(id) ON DELETE RESTRICT,
  type_id     INTEGER REFERENCES product_types(id) ON DELETE RESTRICT,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_section  ON products(section_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand    ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_type     ON products(type_id);
CREATE INDEX IF NOT EXISTS idx_images_product    ON product_images(product_id, position);
`;

function seed(db: DatabaseSync) {
  const countSections = db.prepare("SELECT COUNT(*) AS n FROM sections").get() as { n: number };
  if (countSections.n === 0) {
    const insert = db.prepare("INSERT INTO sections (name, slug, position) VALUES (?, ?, ?)");
    insert.run("General", "general", 0);
    insert.run("Casa Comercial", "casa-comercial", 1);
  }

  const countTypes = db.prepare("SELECT COUNT(*) AS n FROM product_types").get() as { n: number };
  if (countTypes.n === 0) {
    const insert = db.prepare("INSERT INTO product_types (name, slug) VALUES (?, ?)");
    insert.run("Lujo", "lujo");
    insert.run("Calcomanía", "calcomania");
  }
}

function connect(): DatabaseSync {

  // `timeout` evita "database is locked" cuando varios procesos (los workers
  // del build de Next, o dev + build a la vez) abren el archivo en paralelo.
  const db = new DatabaseSync(DB_FILE, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });

  try {
    db.exec("PRAGMA journal_mode = WAL;");
  } catch {
    // Otro proceso tiene el lock exclusivo; ya está o quedará en WAL.
  }

  db.exec(SCHEMA);
  seed(db);
  return db;
}

// Next.js reloads modules on every edit in dev, so the connection is cached on
// globalThis to avoid opening a new file handle per hot reload.
const globalForDb = globalThis as unknown as { __catalogoDb?: DatabaseSync };

export const db: DatabaseSync = globalForDb.__catalogoDb ?? connect();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__catalogoDb = db;
}
