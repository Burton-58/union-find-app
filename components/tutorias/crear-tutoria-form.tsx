"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { crearTutoria, type CrearTutoriaState } from "@/app/protected/actions";
import { MAX_CUPOS_TUTORIA } from "@/lib/tutorias";

export function CrearTutoriaForm() {
  const [estado, accion, enviando] = useActionState<CrearTutoriaState, FormData>(
    crearTutoria,
    {},
  );

  const campo =
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";
  const etiqueta = "text-xs font-bold uppercase text-muted-foreground";

  // Si hubo un error se conservan los valores escritos (React 19 limpia los
  // formularios no controlados después de cada acción).
  const v = estado.valores;

  return (
    <form action={accion} className="flex flex-col gap-5">
      <div className="grid gap-1.5">
        <label htmlFor="ct-materia" className={etiqueta}>
          Materia o tema
        </label>
        <input
          id="ct-materia"
          name="subject"
          required
          minLength={3}
          maxLength={100}
          defaultValue={v?.subject}
          placeholder="Ej. Cálculo II: Integrales"
          className={campo}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="ct-fecha" className={etiqueta}>
            Fecha y hora
          </label>
          <input
            id="ct-fecha"
            name="session_date"
            type="datetime-local"
            required
            defaultValue={v?.session_date}
            className={`${campo} dark:[color-scheme:dark]`}
          />
          <p className="text-xs text-muted-foreground">Hora de Costa Rica.</p>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="ct-cupos" className={etiqueta}>
            Cupos
          </label>
          <input
            id="ct-cupos"
            name="capacity"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={MAX_CUPOS_TUTORIA}
            step={1}
            defaultValue={v?.capacity ?? "5"}
            className={campo}
          />
          <p className="text-xs text-muted-foreground">
            Cuántos estudiantes pueden inscribirse (máximo {MAX_CUPOS_TUTORIA}).
          </p>
        </div>
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-red-500">
          {estado.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={enviando}
          className="flex items-center gap-2 rounded-lg bg-[#003366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004a99] active:scale-95 disabled:opacity-60"
        >
          {enviando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {enviando ? "Publicando..." : "Publicar tutoría"}
        </button>
      </div>
    </form>
  );
}
