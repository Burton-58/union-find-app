"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Send } from "lucide-react";
import { cancelarInscripcion, inscribirse } from "@/app/protected/actions";
import { cn } from "@/lib/utils";

/**
 * Inscribirse / cancelar inscripción en una tutoría.
 * `bloqueo` es el motivo por el que no se puede inscribir (tutoría llena,
 * ya terminó, es tuya...). Si ya estás inscrito siempre puedes cancelar.
 */
export function InscripcionButton({
  postId,
  inscrito,
  bloqueo,
}: {
  postId: string;
  inscrito: boolean;
  bloqueo?: string | null;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const r = await (inscrito ? cancelarInscripcion : inscribirse)(postId);
      if (!r.ok) setError(r.error);
      router.refresh(); // el estado pudo cambiar (p. ej. la tutoría se llenó)
    });
  };

  const deshabilitado = pendiente || (!inscrito && !!bloqueo);

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        type="button"
        onClick={onClick}
        disabled={deshabilitado}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-300 active:scale-95 disabled:cursor-not-allowed",
          inscrito
            ? "border border-red-300 bg-transparent text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
            : "bg-sky-600 text-white hover:bg-sky-700",
          !inscrito && bloqueo && "bg-slate-400 hover:bg-slate-400",
          pendiente && "opacity-70",
        )}
      >
        {pendiente ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {inscrito ? "Cancelando..." : "Inscribiendo..."}
          </>
        ) : inscrito ? (
          <>
            <Check size={16} />
            Inscrito · Cancelar inscripción
          </>
        ) : (
          <>
            <Send size={16} />
            {bloqueo ?? "Solicitar Unirse a Tutoría"}
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
