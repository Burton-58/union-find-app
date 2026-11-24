"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const campo =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";

export function PerfilNombreForm({
  userId,
  nombreInicial,
}: {
  userId: string;
  nombreInicial: string;
}) {
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(nombreInicial);
  const [nombre, setNombre] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const cancelar = () => {
    setNombre(guardado);
    setError(null);
    setEditando(false);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nombre.trim();

    if (limpio.length < 2) {
      setError("Escribe tu nombre completo.");
      return;
    }

    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: limpio })
      .eq("id", userId)
      .select("id");

    if (error) {
      setError("No pudimos guardar tu nombre. Inténtalo de nuevo.");
      setGuardando(false);
      return;
    }

    if (!data || data.length === 0) {
      setError("No encontramos tu perfil en la base de datos.");
      setGuardando(false);
      return;
    }

    setGuardado(limpio);
    setNombre(limpio);
    setEditando(false);
    setGuardando(false);
    router.refresh();
  };

  return (
    <div className="rounded-xl bg-muted/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <UserRound size={14} className="text-sky-600" />
          Nombre completo
        </p>
        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label="Editar nombre"
            title="Editar nombre"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {editando ? (
        <form onSubmit={guardar} className="mt-2 flex flex-col gap-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            autoFocus
            placeholder="Ej. Ana María Rojas"
            className={campo}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-1.5 rounded-lg bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#004a99] active:scale-95 disabled:opacity-60"
            >
              {guardando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cancelar}
              disabled={guardando}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-1 text-sm font-bold">
          {guardado || "Sin nombre registrado"}
        </p>
      )}
    </div>
  );
}