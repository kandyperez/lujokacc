"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";
import { IDLE_STATE } from "@/lib/types";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, IDLE_STATE);

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label className="label-text" htmlFor="email">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.values?.email ?? ""}
          required
          placeholder="correo@ejemplo.com"
          className="field"
        />
      </div>

      <div>
        <label className="label-text" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="field"
        />
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verificando…" : "Ingresar"}
      </button>
    </form>
  );
}
