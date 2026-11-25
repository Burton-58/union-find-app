"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarSolicitud, resolverSolicitud } from "@/app/protected/actions";

export function SolicitudAcciones({
  id,
  resuelta,
  moderando = false,
}: {
  id: string;
  resuelta: boolean;
  /** true cuando un administrador elimina la solicitud de otra persona */
  moderando?: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ejecutar = (accion: (id: string) => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await accion(id);
      if (!r.ok) setError(r.error ?? "Ocurrió un error.");
      router.refresh();
    });
  };

  const boton =
    "rounded-md px-2 py-1 text-xs transition hover:bg-muted disabled:opacity-60";

  return (
    <span className="inline-flex flex-col items-end">
      <span className="inline-flex gap-1">
        {!resuelta && !moderando && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => ejecutar(resolverSolicitud)}
            className={`${boton} text-emerald-700 dark:text-emerald-400`}
          >
            Marcar como resuelta
          </button>
        )}
        <button
          type="button"
          disabled={pendiente}
          onClick={() => {
            const msg = moderando
              ? "¿Eliminar esta solicitud como administrador?"
              : "¿Eliminar tu solicitud?";
            if (window.confirm(msg)) ejecutar(eliminarSolicitud);
          }}
          className={`${boton} text-muted-foreground hover:text-red-600`}
        >
          {moderando ? "Eliminar (admin)" : "Eliminar"}
        </button>
      </span>
      {error && (
        <span role="alert" className="text-xs text-red-500">
          {error}
        </span>
      )}
    </span>
  );
}
