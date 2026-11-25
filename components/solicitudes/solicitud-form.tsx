"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { crearSolicitud, type SolicitudFormState } from "@/app/protected/actions";

export function SolicitudForm() {
  const [estado, accion, enviando] = useActionState<SolicitudFormState, FormData>(
    crearSolicitud,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Limpia el formulario cuando la solicitud se publicó bien
  useEffect(() => {
    if (estado.creada) formRef.current?.reset();
  }, [estado]);

  const campo =
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";

  return (
    <form ref={formRef} action={accion} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="sol-materia" className="text-xs font-bold uppercase text-muted-foreground">
          Materia o tema
        </label>
        <input
          id="sol-materia"
          name="subject"
          required
          minLength={3}
          maxLength={100}
          placeholder="Ej. Cálculo Diferencial, Estructuras de Datos..."
          className={campo}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="sol-detalle" className="text-xs font-bold uppercase text-muted-foreground">
          Detalles (opcional)
        </label>
        <textarea
          id="sol-detalle"
          name="details"
          rows={4}
          maxLength={500}
          placeholder="¿Con qué necesitas ayuda? ¿Qué días o horarios te sirven?"
          className={campo}
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-red-500">
          {estado.error}
        </p>
      )}
      {estado.creada && !enviando && (
        <p role="status" className="text-sm text-emerald-600">
          ¡Solicitud publicada! Los tutores ya pueden verla.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={enviando}
          className="flex items-center gap-2 rounded-lg bg-[#003366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004a99] active:scale-95 disabled:opacity-60"
        >
          {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {enviando ? "Publicando..." : "Publicar solicitud"}
        </button>
      </div>
    </form>
  );
}
