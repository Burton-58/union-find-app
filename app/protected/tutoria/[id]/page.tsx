import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, Lock, Star } from "lucide-react";
import { SolicitarButton } from "@/components/solicitar-button";
import {
  colorMateria,
  cuposLibres,
  formatFechaLarga,
  getTutoria,
  iniciales,
} from "@/lib/tutorias";
import { cn } from "@/lib/utils";

export default async function TutoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutoria = getTutoria(id);

  if (!tutoria) {
    notFound();
  }

  const libres = cuposLibres(tutoria);
  const porcentaje = Math.round((tutoria.inscritos / tutoria.cuposMax) * 100);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/protected"
        className="group flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground animate-in fade-in duration-500"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Volver a tutorías
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold",
                colorMateria(tutoria.codigo)
              )}
            >
              {tutoria.codigo}
            </span>
            <span className="text-sm text-muted-foreground">{tutoria.materia}</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {tutoria.titulo}
          </h1>

          <div className="rounded-xl border bg-muted/50 p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Temas a tratar
            </h2>
            <ul className="flex flex-col gap-2">
              {tutoria.temas.map((tema, i) => (
                <li
                  key={tema}
                  style={{ animationDelay: `${150 + i * 90}ms` }}
                  className="flex gap-3 text-sm animate-in fade-in slide-in-from-left-2 fill-mode-both duration-500"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                  {tema}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha y hora</p>
              <p className="mt-1 text-sm font-bold">{formatFechaLarga(tutoria.fecha)}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lugar / Modalidad</p>
              <p className="mt-1 text-sm font-bold">
                {tutoria.lugar} • {tutoria.modalidad === "virtual" ? "Virtual" : "Presencial"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info size={16} className="shrink-0 text-sky-600" />
              Notificación automática al tutor previa aprobación
            </p>
            <SolicitarButton disabled={libres === 0} />
          </div>
        </section>

        <aside className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-right-3 duration-500">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#003366] text-2xl font-bold text-white shadow-md transition-transform duration-300 hover:scale-105">
              {iniciales(tutoria.tutor)}
            </div>
            <h2 className="mt-2 text-lg font-bold">{tutoria.tutor}</h2>
            <p className="text-sm text-muted-foreground">{tutoria.tutorRol}</p>
            <p className="mt-1 flex items-center gap-1 text-sm">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-amber-500">{tutoria.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({tutoria.resenas} reseñas)</span>
            </p>
          </div>

          <dl className="flex flex-col gap-3 border-t pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cupos Máximos:</dt>
              <dd className="font-bold">{tutoria.cuposMax} Estudiantes</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Inscritos actualmente:</dt>
              <dd className="font-bold text-emerald-600">{tutoria.inscritos} Confirmados</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Disponibilidad:</dt>
              <dd className={cn("font-bold", libres === 0 ? "text-red-600" : "text-sky-600")}>
                {libres === 0 ? "Sin cupos" : `${libres} ${libres === 1 ? "Cupo libre" : "Cupos libres"}`}
              </dd>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                style={{ width: `${porcentaje}%` }}
                className="h-full rounded-full bg-sky-600 transition-all duration-700"
              />
            </div>
          </dl>

          <p className="mt-auto flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
            <Lock size={14} className="mt-0.5 shrink-0" />
            Al confirmar, el tutor recibirá tu solicitud de cupo instantáneamente.
          </p>
        </aside>
      </div>
    </div>
  );
}