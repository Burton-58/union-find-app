import Link from "next/link";
import { Calendar, MapPin, Star, Video } from "lucide-react";
import {
  type Tutoria,
  colorMateria,
  cuposLibres,
  formatFechaCorta,
} from "@/lib/tutorias";
import { cn } from "@/lib/utils";

export function TutoriaCard({ tutoria, index }: { tutoria: Tutoria; index: number }) {
  const libres = cuposLibres(tutoria);
  const virtual = tutoria.modalidad === "virtual";

  return (
    <article
      style={{ animationDelay: `${index * 80}ms` }}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide",
            colorMateria(tutoria.codigo)
          )}
        >
          {tutoria.codigo} {tutoria.materia.split(" ")[0]}
        </span>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-semibold",
            libres === 0
              ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          )}
        >
          {libres === 0
            ? "Sin cupos"
            : `${libres} ${libres === 1 ? "Cupo disponible" : "Cupos disponibles"}`}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-bold leading-snug">{tutoria.titulo}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          Tutor: {tutoria.tutor}
          <span>•</span>
          <Star size={14} className="fill-amber-400 text-amber-400" />
          {tutoria.rating.toFixed(1)} ({tutoria.resenas} tutorías)
        </p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-sky-600" />
          {formatFechaCorta(tutoria.fecha)}
        </span>
        <span className="flex items-center gap-1.5">
          {virtual ? (
            <Video size={14} className="text-sky-600" />
          ) : (
            <MapPin size={14} className="text-sky-600" />
          )}
          {tutoria.lugar}
        </span>
      </div>

      <Link
        href={`/protected/tutoria/${tutoria.id}`}
        className="mt-auto rounded-lg bg-[#003366] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-[#004a99] active:scale-[0.98]"
      >
        Ver Detalles & Reservar
      </Link>
    </article>
  );
}