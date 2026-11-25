import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { ResumenCalificacion } from "@/components/estrellas";
import {
  type Tutoria,
  colorMateria,
  cuposLibres,
  formatFechaCorta,
  haTerminado,
  nombreDe,
} from "@/lib/tutorias";
import { cn } from "@/lib/utils";

export function TutoriaCard({ tutoria, index }: { tutoria: Tutoria; index: number }) {
  const libres = cuposLibres(tutoria);
  const terminada = haTerminado(tutoria);

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 80}ms` }}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 hover:-translate-y-1 hover:shadow-lg",
        terminada && "opacity-80",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide",
            colorMateria(tutoria.materia),
          )}
        >
          Tutoría
        </span>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-semibold",
            terminada
              ? "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
              : libres === 0
                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
          )}
        >
          {terminada
            ? "Finalizada"
            : libres === 0
              ? "Sin cupos"
              : `${libres} ${libres === 1 ? "Cupo disponible" : "Cupos disponibles"}`}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-bold leading-snug">{tutoria.materia}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>Tutor: {nombreDe(tutoria.tutor)}</span>
          <span>•</span>
          <ResumenCalificacion calificacion={tutoria.calificacion} />
        </p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-sky-600" />
          {formatFechaCorta(tutoria.fecha)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-sky-600" />
          {tutoria.inscritos}/{tutoria.cuposMax} inscritos
        </span>
      </div>

      <Link
        href={`/protected/tutoria/${tutoria.id}`}
        className="mt-auto rounded-lg bg-[#003366] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-[#004a99] active:scale-[0.98]"
      >
        {terminada ? "Ver detalles" : "Ver Detalles & Reservar"}
      </Link>
    </article>
  );
}
