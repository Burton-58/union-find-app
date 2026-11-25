import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/tutorias";

/**
 * Etiqueta de rol. El administrador lleva un color propio (violeta) y un
 * escudo para que no se confunda con un tutor o un estudiante.
 */
export function RolBadge({
  rol,
  etiqueta,
  className,
}: {
  rol: Role;
  /** Texto ya calculado con etiquetaRol(), p. ej. "Estudiante y Tutor" */
  etiqueta: string;
  className?: string;
}) {
  const admin = rol === "admin";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold",
        admin
          ? "bg-violet-600 text-white dark:bg-violet-500"
          : "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
        className,
      )}
    >
      {admin && <ShieldCheck size={12} aria-hidden />}
      {etiqueta}
    </span>
  );
}
