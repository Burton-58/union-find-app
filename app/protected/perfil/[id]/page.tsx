import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { ResumenCalificacion } from "@/components/estrellas";
import { ResenasSection } from "@/components/resenas/resenas-section";
import { createClient } from "@/lib/supabase/server";
import { getPerfil, getTutoriasDeTutor, getViewer } from "@/lib/tutorias_db";
import { getCalificaciones, getResenaPropia, getResenas, puedeCalificar } from "@/lib/resenas";
import { etiquetaRol } from "@/lib/roles";
import {
  esUuid,
  formatFechaCorta,
  haTerminado,
  iniciales,
  nombreDe,
} from "@/lib/tutorias";

async function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esUuid(id)) notFound();

  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect("/auth/login");
  if (viewer.id === id) redirect("/protected/perfil");

  const [perfil, tutorias, resenas, calificaciones, resenaPropia, calificar] = await Promise.all([
    getPerfil(supabase, id),
    getTutoriasDeTutor(supabase, id),
    getResenas(supabase, id),
    getCalificaciones(supabase, [id]),
    getResenaPropia(supabase, id, viewer.id),
    puedeCalificar(supabase, id),
  ]);
  if (!perfil) notFound();

  const nombre = nombreDe(perfil);
  const calificacion = calificaciones.get(id) ?? null;
  const esTutor = perfil.esTutor;
  const mostrarResenas = esTutor || resenas.length > 0;
  const ordenadas = [...tutorias].sort((a, b) => {
    const ta = haTerminado(a) ? 1 : 0;
    const tb = haTerminado(b) ? 1 : 0;
    if (ta !== tb) return ta - tb;
    return (a.fecha ?? "9").localeCompare(b.fecha ?? "9");
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/protected"
        className="group flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Volver a tutorías
      </Link>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="flex h-fit flex-col items-center gap-1 rounded-2xl border bg-card p-6 text-center shadow-sm animate-in fade-in slide-in-from-left-3 duration-500">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#003366] text-3xl font-bold text-white shadow-md">
            {iniciales(nombre)}
          </div>
          <h1 className="mt-3 text-xl font-bold">{nombre}</h1>
          <span className="mt-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
            {etiquetaRol(perfil.rol, perfil.esTutor)}
          </span>
          {esTutor && (
            <div className="mt-2">
              <ResumenCalificacion calificacion={calificacion} />
            </div>
          )}
        </aside>

        <div className="flex flex-col gap-6">
          {esTutor && (
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Tutorías de {nombre} ({tutorias.length})
              </h2>
              {ordenadas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no ha publicado tutorías.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {ordenadas.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/protected/tutoria/${t.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-4 text-sm transition hover:bg-muted"
                      >
                        <span className="font-bold">{t.materia}</span>
                        <span className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-sky-600" />
                            {formatFechaCorta(t.fecha)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-sky-600" />
                            {t.inscritos}/{t.cuposMax}
                          </span>
                          {haTerminado(t) && <span className="font-semibold">Finalizada</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {mostrarResenas && (
            <div id="resenas" className="scroll-mt-24">
              <ResenasSection
                tutorId={perfil.id}
                tutorNombre={nombre}
                viewerId={viewer.id}
                viewerRol={viewer.rol}
                resenas={resenas}
                resenaPropia={resenaPropia}
                calificacion={calificacion}
                puedeCalificar={calificar}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando perfil...</p>}>
      <PerfilPublico params={params} />
    </Suspense>
  );
}
