import Link from "next/link";
import { EliminarResenaButton } from "@/components/resenas/eliminar-resena-button";
import { ResenaForm } from "@/components/resenas/resena-form";
import { Estrellas, ResumenCalificacion } from "@/components/estrellas";
import { RESENAS_LIMITE } from "@/lib/resenas";
import { formatFechaDia, nombreDe, type Calificacion, type Resena, type Role } from "@/lib/tutorias";

/** Todo lo relacionado con reseñas en la página de un tutor. */
export function ResenasSection({
  tutorId,
  tutorNombre,
  viewerId,
  viewerRol,
  resenas,
  resenaPropia,
  calificacion,
  puedeCalificar,
}: {
  tutorId: string;
  tutorNombre: string;
  viewerId: string;
  viewerRol: Role;
  resenas: Resena[];
  resenaPropia: Resena | null;
  calificacion: Calificacion | null;
  puedeCalificar: boolean;
}) {
  const esPerfilPropio = tutorId === viewerId;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Reseñas</h2>
        <ResumenCalificacion calificacion={calificacion} size={16} />
      </div>

      {puedeCalificar ? (
        <ResenaForm
          key={resenaPropia?.id ?? "nueva"}
          tutorId={tutorId}
          tutorNombre={tutorNombre}
          esEdicion={!!resenaPropia}
          ratingInicial={resenaPropia?.rating}
          comentarioInicial={resenaPropia?.comentario ?? ""}
        />
      ) : (
        !esPerfilPropio && (
          <p className="text-sm text-muted-foreground">
            Podrás calificar a {tutorNombre} después de asistir a una de sus tutorías.
          </p>
        )
      )}

      {resenas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {esPerfilPropio ? "Nadie te ha calificado todavía." : "Aún no hay reseñas."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {resenas.map((r) => {
            const mia = r.autor?.id === viewerId;
            const editada = new Date(r.actualizada).getTime() - new Date(r.creada).getTime() > 60_000;
            return (
              <li key={r.id} className="flex flex-col gap-1.5 rounded-xl bg-muted/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Estrellas valor={r.rating} size={15} />
                    {r.autor ? (
                      <Link
                        href={`/protected/perfil/${r.autor.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {nombreDe(r.autor)}
                        {mia && " (tú)"}
                      </Link>
                    ) : (
                      <span className="font-medium">Usuario eliminado</span>
                    )}
                    <span className="text-muted-foreground">
                      · {formatFechaDia(r.creada)}
                      {editada && " (editada)"}
                    </span>
                  </div>
                  {(mia || viewerRol === "admin") && (
                    <EliminarResenaButton resenaId={r.id} moderando={!mia} />
                  )}
                </div>
                {r.comentario && <p className="whitespace-pre-line text-sm">{r.comentario}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {resenas.length === RESENAS_LIMITE && (
        <p className="text-xs text-muted-foreground">
          Mostrando las últimas {RESENAS_LIMITE} reseñas.
        </p>
      )}
    </section>
  );
}
