import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Credenciales de administrador. Por ahora hardcodeadas, con opción de
// sobreescribirlas por variables de entorno sin tocar el código.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@lujos.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

const SESSION_COOKIE = "lujos_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-cambiar-en-produccion";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyCredentials(email: string, password: string): boolean {
  // Ambas comparaciones se ejecutan siempre para no filtrar cuál de las dos falló.
  const emailOk = safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase());
  const passwordOk = safeEqual(password, ADMIN_PASSWORD);
  return emailOk && passwordOk;
}

export async function createSession(email: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${email}.${expiresAt}`;
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Devuelve el email del admin autenticado, o `null` si no hay sesión válida. */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload))) return null;

  const separator = payload.lastIndexOf(".");
  const email = payload.slice(0, separator);
  const expiresAt = Number(payload.slice(separator + 1));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return email;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

/**
 * Guardia para Server Actions y páginas del panel. Los Server Actions son
 * invocables por POST directo, así que cada uno debe verificar la sesión.
 */
export async function requireAdmin(): Promise<string> {
  const email = await getSession();
  if (!email) throw new Error("No autorizado");
  return email;
}
