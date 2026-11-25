import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Info, Lock, ShieldCheck, Star } from "lucide-react";
import { AdminBoton } from "@/components/admin/admin-boton";
import { InscripcionButton } from "@/components/inscripcion-button";
import { ResumenCalificacion } from "@/components/estrellas";
import { createClient } from "@/lib/supabase/server";
import { getInscripciones, getInscritosPorTutoria, getTutoria, getViewer } from "@/lib/tutorias_db";
import { puedeCalificar } from "@/lib/resenas";
import {
  colorMateria,
  cuposLibres,
  esUuid,
  formatFechaLarga,
  haTerminado,
  iniciales,
  nombreDe,
} from "@/lib/tutorias";
import { cn } from "@/lib/utils";

async function TutoriaDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esUuid(id)) notFound();

  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect("/auth/login");

  const tutoria = await getTutoria(supabase, id);
  if (!tutoria) notFound();

  const tutorId = tutoria.tutor?.id ?? null;
  const esAdmin = viewer.rol === "admin";
  const [inscripciones, calificar, roster] = await Promise.all([
    getInscripciones(supabase, viewer.id),
    tutorId ? puedeCalificar(supabase, tutorId) : Promise.resolve(false),
    // Solo los administradores ven (y pueden quitar) a los inscritos desde aquí
    esAdmin ? getInscritosPorTutoria(supabase, [tutoria.id]) : Promise.resolve(null),
  ]);
  const estudiantes = roster?.get(tutoria.id) ?? [];

  const inscrito = inscripciones.has(tutoria.id);
  const libres = cuposLibres(tutoria);
  const terminada = haTerminado(tutoria);
  const esMia = tutorId === viewer.id;
  const porcentaje = tutoria.cuposMax
    ? Math.min(Math.round((tutoria.inscritos / tutoria.cuposMax) * 100), 100)
    : 0;
  const nombreTutor = nombreDe(tutoria.tutor);

  const bloqueo = esMia
    ? "Esta es tu tutoría"
    : terminada
      ? "Tutoría finalizada"
      : libres === 0
        ? "Sin cupos disponibles"
        : null;

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
                colorMateria(tutoria.materia),
              )}
            >
              Tutoría
            </span>
            {terminada && (
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                Finalizada
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {tutoria.materia}
          </h1>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha y hora</p>
              <p className="mt-1 text-sm font-bold">{formatFechaLarga(tutoria.fecha)}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tutor</p>
              <p className="mt-1 text-sm font-bold">{nombreTutor}</p>
            </div>
          </div>

          {calificar && tutorId && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <p className="flex items-center gap-2">
                <Star size={16} className="shrink-0 fill-amber-400 text-amber-400" />
                ¿Ya asististe a una tutoría con {nombreTutor}? Cuéntanos qué tal te fue.
              </p>
              <Link
                href={`/protected/perfil/${tutorId}#resenas`}
                className="rounded-lg bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-amber-600 active:scale-95"
              >
                Calificar tutor
              </Link>
            </div>
          )}

          {esAdmin && (
            <div className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-bold text-violet-900 dark:text-violet-200">
                  <ShieldCheck size={16} className="shrink-0" />
                  Acciones de administrador
                </p>
                <AdminBoton
                  accion={{
                    tipo: "tutoria",
                    postId: tutoria.id,
                    materia: tutoria.materia,
                    inscritos: tutoria.inscritos,
                  }}
                  redirigirA="/protected"
                />
              </div>
              <details className="text-sm text-violet-900 dark:text-violet-200">
                <summary className="cursor-pointer font-medium">
                  Estudiantes inscritos ({estudiantes.length})
                </summary>
                {estudiantes.length === 0 ? (
                  <p className="mt-2 opacity-80">Nadie se ha inscrito todavía.</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1">
                    {estudiantes.map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-2">
                        <Link
                          href={`/protected/perfil/${e.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {nombreDe(e)}
                        </Link>
                        <AdminBoton
                          accion={{
                            tipo: "inscripcion",
                            postId: tutoria.id,
                            studentId: e.id,
                            nombre: nombreDe(e),
                          }}
                          compacto
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info size={16} className="shrink-0 text-sky-600" />
              {inscrito ? "Tu cupo está confirmado." : "Tu cupo se confirma al instante."}
            </p>
            <InscripcionButton postId={tutoria.id} inscrito={inscrito} bloqueo={bloqueo} />
          </div>
        </section>

        <aside className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-right-3 duration-500">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#003366] text-2xl font-bold text-white shadow-md transition-transform duration-300 hover:scale-105">
              {iniciales(nombreTutor)}
            </div>
            <h2 className="mt-2 text-lg font-bold">
              {tutorId ? (
                <Link
                  href={esMia ? "/protected/perfil" : `/protected/perfil/${tutorId}`}
                  className="underline-offset-4 hover:underline"
                >
                  {nombreTutor}
                </Link>
              ) : (
                nombreTutor
              )}
            </h2>
            <ResumenCalificacion calificacion={tutoria.calificacion} />
            {tutorId && (
              <Link
                href={esMia ? "/protected/perfil" : `/protected/perfil/${tutorId}#resenas`}
                className="mt-1 text-xs text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
              >
                Ver perfil y reseñas
              </Link>
            )}
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
              <dd className={cn("font-bold", terminada || libres === 0 ? "text-red-600" : "text-sky-600")}>
                {terminada
                  ? "Finalizada"
                  : libres === 0
                    ? "Sin cupos"
                    : `${libres} ${libres === 1 ? "Cupo libre" : "Cupos libres"}`}
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
            Los cupos se reservan en orden de llegada; nunca se vende más de la capacidad.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default function TutoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando tutoría...</p>}>
      <TutoriaDetalle params={params} />
    </Suspense>
  );
}
