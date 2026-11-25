import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminBoton } from "@/components/admin/admin-boton";
import { Estrellas } from "@/components/estrellas";
import { EliminarResenaButton } from "@/components/resenas/eliminar-resena-button";
import { RolBadge } from "@/components/rol-badge";
import { SolicitudAcciones } from "@/components/solicitudes/solicitud-acciones";
import { createClient } from "@/lib/supabase/server";
import { getTodasLasResenas, getUsuarios, RESENAS_ADMIN_LIMITE } from "@/lib/admin";
import { etiquetaRol } from "@/lib/roles";
import { getSolicitudes, SOLICITUDES_LIMITE } from "@/lib/solicitudes";
import { getInscritosPorTutoria, getTutorias, getViewer } from "@/lib/tutorias_db";
import {
  formatFechaCorta,
  formatFechaDia,
  haTerminado,
  iniciales,
  nombreDe,
  type Tutoria,
} from "@/lib/tutorias";
import { cn } from "@/lib/utils";

const TARJETA = "flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm";
const TITULO = "text-xs font-bold uppercase tracking-wide text-muted-foreground";

const porFecha = (a: Tutoria, b: Tutoria) => (a.fecha ?? "9").localeCompare(b.fecha ?? "9");

async function PanelAdmin() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect("/auth/login");
  // Solo administradores (la base de datos también lo exige en cada acción)
  if (viewer.rol !== "admin") redirect("/protected");

  const tutorias = await getTutorias(supabase);
  const [usuarios, roster, resenas, solicitudes] = await Promise.all([
    getUsuarios(supabase, tutorias),
    getInscritosPorTutoria(
      supabase,
      tutorias.map((t) => t.id),
    ),
    getTodasLasResenas(supabase),
    getSolicitudes(supabase),
  ]);

  const proximas = tutorias.filter((t) => !haTerminado(t)).sort(porFecha);
  const pasadas = tutorias.filter((t) => haTerminado(t)).sort((a, b) => porFecha(b, a));
  const tutoriasOrdenadas = [...proximas, ...pasadas];

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Panel de administración
          </h1>
          <RolBadge rol="admin" etiqueta="Administrador" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Modera cuentas, tutorías, reseñas y solicitudes. Las eliminaciones no se pueden
          deshacer.
        </p>
      </div>

      {/* ------------------------------------------------------------ Usuarios */}
      <section className={TARJETA}>
        <h2 className={TITULO}>Usuarios ({usuarios.length})</h2>
        <p className="text-xs text-muted-foreground">
          Eliminar una cuenta borra también sus tutorías (y las inscripciones a ellas), sus
          inscripciones, sus reseñas y sus solicitudes.
        </p>
        <ul className="flex flex-col gap-2">
          {usuarios.map((u) => {
            const yo = u.id === viewer.id;
            const nombre = nombreDe(u);
            return (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      u.rol === "admin" ? "bg-violet-600" : "bg-[#003366]",
                    )}
                  >
                    {iniciales(nombre)}
                  </span>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Link
                      href={yo ? "/protected/perfil" : `/protected/perfil/${u.id}`}
                      className="truncate text-sm font-bold underline-offset-4 hover:underline"
                    >
                      {nombre}
                      {yo && " (tú)"}
                    </Link>
                    <RolBadge rol={u.rol} etiqueta={etiquetaRol(u.rol, u.esTutor)} />
                    {u.tutorias > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {u.tutorias} {u.tutorias === 1 ? "tutoría" : "tutorías"}
                      </span>
                    )}
                  </div>
                </div>
                {yo ? (
                  <span className="text-xs text-muted-foreground">
                    No puedes eliminar tu propia cuenta
                  </span>
                ) : (
                  <AdminBoton accion={{ tipo: "usuario", userId: u.id, nombre }} compacto />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------ Tutorías */}
      <section className={TARJETA}>
        <h2 className={TITULO}>Tutorías ({tutorias.length})</h2>
        {tutoriasOrdenadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tutorías.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tutoriasOrdenadas.map((t) => {
              const estudiantes = roster.get(t.id) ?? [];
              return (
                <li key={t.id} className="rounded-xl bg-muted/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/protected/tutoria/${t.id}`}
                        className="text-sm font-bold underline-offset-4 hover:underline"
                      >
                        {t.materia}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {nombreDe(t.tutor)} · {formatFechaCorta(t.fecha)} · {t.inscritos}/
                        {t.cuposMax} inscritos
                        {haTerminado(t) && " · Finalizada"}
                      </p>
                    </div>
                    <AdminBoton
                      accion={{
                        tipo: "tutoria",
                        postId: t.id,
                        materia: t.materia,
                        inscritos: t.inscritos,
                      }}
                      compacto
                    />
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
                                postId: t.id,
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
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------- Reseñas */}
      <section className={TARJETA}>
        <h2 className={TITULO}>Reseñas ({resenas.length})</h2>
        {resenas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay reseñas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {resenas.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 rounded-xl bg-muted/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Estrellas valor={r.rating} size={15} />
                    <span className="text-muted-foreground">
                      {r.autor ? nombreDe(r.autor) : "Usuario eliminado"} →{" "}
                      {r.tutor ? (
                        <Link
                          href={`/protected/perfil/${r.tutor.id}#resenas`}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {nombreDe(r.tutor)}
                        </Link>
                      ) : (
                        "Usuario eliminado"
                      )}{" "}
                      · {formatFechaDia(r.creada)}
                    </span>
                  </div>
                  <EliminarResenaButton resenaId={r.id} moderando />
                </div>
                {r.comentario && <p className="whitespace-pre-line text-sm">{r.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
        {resenas.length === RESENAS_ADMIN_LIMITE && (
          <p className="text-xs text-muted-foreground">
            Mostrando las últimas {RESENAS_ADMIN_LIMITE} reseñas.
          </p>
        )}
      </section>

      {/* --------------------------------------------------------- Solicitudes */}
      <section className={TARJETA}>
        <h2 className={TITULO}>Solicitudes de tutor ({solicitudes.length})</h2>
        {solicitudes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay solicitudes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {solicitudes.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "flex flex-col gap-1 rounded-xl bg-muted/60 p-3",
                  s.resuelta && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{s.materia}</h3>
                    {s.resuelta && (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        Resuelta
                      </span>
                    )}
                  </div>
                  <SolicitudAcciones id={s.id} resuelta={s.resuelta} moderando />
                </div>
                {s.detalle && <p className="whitespace-pre-line text-sm">{s.detalle}</p>}
                <p className="text-xs text-muted-foreground">
                  {s.autor ? nombreDe(s.autor) : "Usuario eliminado"} · {formatFechaDia(s.creada)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {solicitudes.length === SOLICITUDES_LIMITE && (
          <p className="text-xs text-muted-foreground">
            Mostrando las últimas {SOLICITUDES_LIMITE} solicitudes.
          </p>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck size={14} className="text-violet-600" />
        Los permisos de administrador los verifica la base de datos en cada acción.
      </p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando panel...</p>}>
      <PanelAdmin />
    </Suspense>
  );
}
