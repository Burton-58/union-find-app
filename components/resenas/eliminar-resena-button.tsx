"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarResena } from "@/app/protected/actions";

export function EliminarResenaButton({
  resenaId,
  moderando = false,
}: {
  resenaId: string;
  /** true cuando un administrador elimina la reseña de otra persona */
  moderando?: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    const msg = moderando
      ? "¿Eliminar esta reseña como administrador? No se puede deshacer."
      : "¿Eliminar tu reseña? No se puede deshacer.";
    if (!window.confirm(msg)) return;

    setError(null);
    startTransition(async () => {
      const r = await eliminarResena(resenaId);
      if (!r.ok) {
        setError(r.error);
        router.refresh();
      }
    });
  };

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={onClick}
        disabled={pendiente}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-red-600 disabled:opacity-60"
      >
        {pendiente ? "Eliminando..." : moderando ? "Eliminar (admin)" : "Eliminar"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-500">
          {error}
        </span>
      )}
    </span>
  );
}
