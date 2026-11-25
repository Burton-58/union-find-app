"use client";

import { useActionState, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { enviarResena, type ResenaFormState } from "@/app/protected/actions";
import { cn } from "@/lib/utils";

const MAX = 1000;

/**
 * Escribir o editar tu reseña de un tutor. Renderízalo con
 * key={resenaExistente?.id ?? "nueva"} para que se reinicie al crear o borrar la reseña.
 */
export function ResenaForm({
  tutorId,
  tutorNombre,
  ratingInicial = 0,
  comentarioInicial = "",
  esEdicion,
}: {
  tutorId: string;
  tutorNombre: string;
  ratingInicial?: number;
  comentarioInicial?: string;
  esEdicion: boolean;
}) {
  const [estado, accion, enviando] = useActionState<ResenaFormState, FormData>(
    enviarResena.bind(null, tutorId),
    {},
  );
  const [rating, setRating] = useState(ratingInicial);
  const [comentario, setComentario] = useState(comentarioInicial);

  return (
    <form action={accion} className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-5">
      <h3 className="font-bold">
        {esEdicion ? "Edita tu reseña" : `Califica a ${tutorNombre}`}
      </h3>

      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">Calificación</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-500"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                required
                className="sr-only"
              />
              <Star
                size={30}
                aria-hidden
                className={cn(
                  "transition-all active:scale-90",
                  n <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40 hover:text-amber-400/70",
                )}
              />
              <span className="sr-only">
                {n} {n === 1 ? "estrella" : "estrellas"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor="resena-comentario" className="text-xs font-bold uppercase text-muted-foreground">
          Comentario (opcional)
        </label>
        <textarea
          id="resena-comentario"
          name="comment"
          rows={4}
          maxLength={MAX}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="¿Qué te sirvió? ¿Qué se podría mejorar?"
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
        />
        <p className="text-right text-xs text-muted-foreground">
          {comentario.length}/{MAX}
        </p>
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-red-500">
          {estado.error}
        </p>
      )}
      {estado.guardada && !enviando && (
        <p role="status" className="text-sm text-emerald-600">
          ¡Reseña guardada, gracias!
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={enviando}
          className="flex items-center gap-2 rounded-lg bg-[#003366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004a99] active:scale-95 disabled:opacity-60"
        >
          {enviando && <Loader2 size={16} className="animate-spin" />}
          {enviando ? "Guardando..." : esEdicion ? "Actualizar reseña" : "Enviar reseña"}
        </button>
      </div>
    </form>
  );
}
