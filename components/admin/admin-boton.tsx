"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserMinus, UserX } from "lucide-react";
import {
  eliminarTutoriaAdmin,
  eliminarUsuarioAdmin,
  quitarEstudianteAdmin,
} from "@/app/protected/actions";
import { cn } from "@/lib/utils";

export type AccionAdmin =
  | { tipo: "tutoria"; postId: string; materia: string; inscritos: number }
  | { tipo: "usuario"; userId: string; nombre: string }
  | { tipo: "inscripcion"; postId: string; studentId: string; nombre: string };

function describir(a: AccionAdmin) {
  switch (a.tipo) {
    case "tutoria": {
      const cancela =
        a.inscritos === 0
          ? ""
          : a.inscritos === 1
            ? " Se cancelará la inscripción de 1 estudiante."
            : ` Se cancelarán las inscripciones de ${a.inscritos} estudiantes.`;
      return {
        etiqueta: "Eliminar tutoría",
        corta: "Eliminar",
        Icono: Trash2,
        confirmar: `¿Eliminar la tutoría "${a.materia}"?${cancela} No se puede deshacer.`,
        ejecutar: () => eliminarTutoriaAdmin(a.postId),
      };
    }
    case "usuario":
      return {
        etiqueta: "Eliminar cuenta",
        corta: "Eliminar cuenta",
        Icono: UserX,
        confirmar: `¿Eliminar la cuenta de ${a.nombre}? Se borrarán también sus tutorías, inscripciones, reseñas y solicitudes. No se puede deshacer.`,
        ejecutar: () => eliminarUsuarioAdmin(a.userId),
      };
    case "inscripcion":
      return {
        etiqueta: "Quitar de la tutoría",
        corta: "Quitar",
        Icono: UserMinus,
        confirmar: `¿Quitar a ${a.nombre} de esta tutoría?`,
        ejecutar: () => quitarEstudianteAdmin(a.postId, a.studentId),
      };
  }
}

/**
 * Botón de acciones destructivas de administrador. Siempre pide confirmación.
 * `redirigirA`: a dónde ir después de borrar algo que deja de existir
 * (p. ej. la página de una tutoría recién eliminada).
 */
export function AdminBoton({
  accion,
  redirigirA,
  compacto = false,
}: {
  accion: AccionAdmin;
  redirigirA?: string;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const d = describir(accion);

  const onClick = () => {
    if (!window.confirm(d.confirmar)) return;
    setError(null);
    startTransition(async () => {
      const r = await d.ejecutar();
      if (!r.ok) {
        setError(r.error);
        router.refresh();
      } else if (redirigirA) {
        router.push(redirigirA);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pendiente}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 transition disabled:cursor-not-allowed disabled:opacity-60",
          compacto
            ? "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-red-600"
            : "rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 active:scale-95 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10",
        )}
      >
        {pendiente ? (
          <Loader2 size={compacto ? 12 : 16} className="animate-spin" />
        ) : (
          <d.Icono size={compacto ? 12 : 16} />
        )}
        {pendiente ? "Eliminando..." : compacto ? d.corta : d.etiqueta}
      </button>
      {error && (
        <span role="alert" className="max-w-xs text-right text-xs text-red-500">
          {error}
        </span>
      )}
    </span>
  );
}
