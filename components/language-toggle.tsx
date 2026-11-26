"use client";

import { useSyncExternalStore } from "react";
import { Languages } from "lucide-react";
import { cambiarIdioma, leerIdioma, type Idioma } from "@/lib/idioma";
import { cn } from "@/lib/utils";

const sinSuscripcion = () => () => {};

/**
 * Botón Español <-> English. Muestra el idioma al que cambiarías.
 * `translate="no"` / `notranslate` evita que Google traduzca el propio botón.
 */
export function LanguageToggle({ className }: { className?: string }) {
  // En el servidor siempre "es" (no hay cookie), y en el cliente se lee la
  // cookie real: así no hay diferencias de hidratación.
  const actual = useSyncExternalStore<Idioma>(sinSuscripcion, leerIdioma, () => "es");
  const destino: Idioma = actual === "es" ? "en" : "es";
  const etiqueta = destino === "en" ? "English" : "Español";

  return (
    <button
      type="button"
      onClick={() => cambiarIdioma(destino)}
      translate="no"
      lang={destino}
      aria-label={destino === "en" ? "Translate this site to English" : "Ver el sitio en español"}
      title={destino === "en" ? "Translate this site to English" : "Ver el sitio en español"}
      className={cn(
        "notranslate flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold transition active:scale-95",
        className,
      )}
    >
      <Languages size={16} aria-hidden />
      {etiqueta}
    </button>
  );
}
