"use server";

import { redirect } from "next/navigation";

import { createSession, destroySession, verifyCredentials } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Ingresa tu correo y contraseña.", values: { email } };
  }

  if (!verifyCredentials(email, password)) {
    return { ok: false, message: "Credenciales incorrectas.", values: { email } };
  }

  await createSession(email.toLowerCase());
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
