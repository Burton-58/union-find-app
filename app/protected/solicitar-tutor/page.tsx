import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SolicitudAcciones } from "@/components/solicitudes/solicitud-acciones";
import { SolicitudForm } from "@/components/solicitudes/solicitud-form";
import { createClient } from "@/lib/supabase/server";
import { getSolicitudes, MAX_SOLICITUDES_ABIERTAS, SOLICITUDES_LIMITE } from "@/lib/solicitudes";
import { getViewer } from "@/lib/tutorias_db";
import { formatFechaDia, nombreDe } from "@/lib/tutorias";
import { cn } from "@/lib/utils";

async function SolicitarTutor() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect("/auth/login");

  const solicitudes = await getSolicitudes(supabase);
  const abiertasMias = solicitudes.filter((s) => !s.resuelta && s.autor?.id === viewer.id).length;
  const esTutor = viewer.rol !== "student";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Solicitar Tutor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ¿No encuentras una tutoría de lo que necesitas? Publica una solicitud y los tutores
          podrán verla.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Nueva solicitud
          </h2>
          {abiertasMias >= MAX_SOLICITUDES_ABIERTAS ? (
            <p className="text-sm text-muted-foreground">
              Ya tienes {MAX_SOLICITUDES_ABIERTAS} solicitudes abiertas. Marca alguna como resuelta
              para publicar otra.
            </p>
          ) : (
            <SolicitudForm />
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Solicitudes ({solicitudes.length})
          </h2>
          {esTutor && (
            <p className="text-sm text-muted-foreground">
              Si puedes ayudar con alguna, publica una tutoría de ese tema para que los
              estudiantes se inscriban.
            </p>
          )}

          {solicitudes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay solicitudes.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {solicitudes.map((s) => {
                const mia = s.autor?.id === viewer.id;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-xl bg-muted/60 p-4",
                      s.resuelta && "opacity-60",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{s.materia}</h3>
                        {s.resuelta && (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            Resuelta
                          </span>
                        )}
                      </div>
                      {(mia || viewer.rol === "admin") && (
                        <SolicitudAcciones id={s.id} resuelta={s.resuelta} moderando={!mia} />
                      )}
                    </div>
                    {s.detalle && <p className="whitespace-pre-line text-sm">{s.detalle}</p>}
                    <p className="text-xs text-muted-foreground">
                      {s.autor ? (
                        mia ? (
                          "Tú"
                        ) : (
                          <Link
                            href={`/protected/perfil/${s.autor.id}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {nombreDe(s.autor)}
                          </Link>
                        )
                      ) : (
                        "Usuario eliminado"
                      )}{" "}
                      · {formatFechaDia(s.creada)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {solicitudes.length === SOLICITUDES_LIMITE && (
            <p className="text-xs text-muted-foreground">
              Mostrando las últimas {SOLICITUDES_LIMITE} solicitudes.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SolicitarTutorPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando solicitudes...</p>}>
      <SolicitarTutor />
    </Suspense>
  );
}
