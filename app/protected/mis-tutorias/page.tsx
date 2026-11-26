import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Plus, Users } from "lucide-react";
import { TutoriaCard } from "@/components/tutoria-card";
import { createClient } from "@/lib/supabase/server";
import {
  getInscritosPorTutoria,
  getTutoriasDeTutor,
  getTutoriasInscritas,
  getViewer,
} from "@/lib/tutorias_db";
import { formatFechaCorta, haTerminado, nombreDe, type Tutoria } from "@/lib/tutorias";

const porFecha = (a: Tutoria, b: Tutoria) =>
  (a.fecha ?? "9").localeCompare(b.fecha ?? "9");

function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

async function MisTutorias() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect("/auth/login");

  const esTutor = viewer.esTutor;
  const [inscritas, dadas] = await Promise.all([
    getTutoriasInscritas(supabase, viewer.id),
    esTutor ? getTutoriasDeTutor(supabase, viewer.id) : Promise.resolve([] as Tutoria[]),
  ]);
  const roster = await getInscritosPorTutoria(
    supabase,
    dadas.map((t) => t.id),
  );

  const proximas = inscritas.filter((t) => !haTerminado(t)).sort(porFecha);
  const pasadas = inscritas.filter((t) => haTerminado(t)).sort((a, b) => porFecha(b, a));
  const dadasOrdenadas = [
    ...dadas.filter((t) => !haTerminado(t)).sort(porFecha),
    ...dadas.filter((t) => haTerminado(t)).sort((a, b) => porFecha(b, a)),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Mis Tutorías</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Las tutorías en las que estás inscrito{esTutor ? " y las que impartes" : ""}.
          </p>
        </div>
        <Link
          href="/protected/crear-tutoria"
          className="flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004a99] active:scale-95"
        >
          <Plus size={16} />
          Crear tutoría
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Próximas ({proximas.length})
        </h2>
        {proximas.length === 0 ? (
          <Vacio>
            No tienes tutorías próximas.{" "}
            <Link href="/protected" className="text-sky-700 underline-offset-4 hover:underline dark:text-sky-400">
              Buscar una tutoría
            </Link>
          </Vacio>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {proximas.map((t, i) => (
              <TutoriaCard key={t.id} tutoria={t} index={i} />
            ))}
          </div>
        )}
      </section>

      {pasadas.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Ya realizadas ({pasadas.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pasadas.map((t, i) => (
              <div key={t.id} className="flex flex-col gap-2">
                <TutoriaCard tutoria={t} index={i} />
                {t.tutor && (
                  <Link
                    href={`/protected/perfil/${t.tutor.id}#resenas`}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                  >
                    Calificar a {nombreDe(t.tutor)}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {esTutor && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Tutorías que imparto ({dadas.length})
          </h2>
          {dadasOrdenadas.length === 0 ? (
            <Vacio>Aún no tienes tutorías publicadas.</Vacio>
          ) : (
            <ul className="flex flex-col gap-3">
              {dadasOrdenadas.map((t) => {
                const estudiantes = roster.get(t.id) ?? [];
                return (
                  <li key={t.id} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/protected/tutoria/${t.id}`}
                        className="font-bold underline-offset-4 hover:underline"
                      >
                        {t.materia}
                      </Link>
                      <span className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    </div>
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer text-sky-700 dark:text-sky-400">
                        Estudiantes inscritos ({estudiantes.length})
                      </summary>
                      {estudiantes.length === 0 ? (
                        <p className="mt-2 text-muted-foreground">Nadie se ha inscrito todavía.</p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-1">
                          {estudiantes.map((e) => (
                            <li key={e.id}>
                              <Link
                                href={`/protected/perfil/${e.id}`}
                                className="underline-offset-4 hover:underline"
                              >
                                {nombreDe(e)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default function MisTutoriasPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando tus tutorías...</p>}>
      <MisTutorias />
    </Suspense>
  );
}
