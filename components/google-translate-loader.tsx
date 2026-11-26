"use client";

import { useEffect } from "react";
import { leerIdioma } from "@/lib/idioma";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string,
        ) => unknown;
      };
    };
    __parcheTraductorAplicado?: boolean;
  }
}

/**
 * Google Translate envuelve los textos en <font>, lo que hace que React falle
 * ("removeChild"/"insertBefore" sobre un nodo que ya no es hijo). Este parche
 * ignora esas operaciones en lugar de romper la página. Solo se aplica cuando
 * el sitio está en inglés.
 */
function aplicarParcheReact() {
  if (window.__parcheTraductorAplicado) return;
  window.__parcheTraductorAplicado = true;

  const quitar = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, hijo: T): T {
    if (hijo.parentNode !== this) return hijo;
    return quitar.call(this, hijo) as T;
  };

  const insertar = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    nuevo: T,
    referencia: Node | null,
  ): T {
    if (referencia && referencia.parentNode !== this) return nuevo;
    return insertar.call(this, nuevo, referencia) as T;
  };
}

/**
 * Carga el traductor de Google solo si el usuario eligió inglés. En español no
 * se carga nada, así que la página funciona exactamente igual que antes.
 */
export function GoogleTranslateLoader() {
  useEffect(() => {
    if (leerIdioma() !== "en") return;
    aplicarParcheReact();

    // Contenedor que pide el widget (se oculta por CSS; la UI es nuestro botón)
    if (!document.getElementById("google_translate_element")) {
      const div = document.createElement("div");
      div.id = "google_translate_element";
      document.body.appendChild(div);
    }

    window.googleTranslateElementInit = () => {
      if (!window.google) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "es", includedLanguages: "en,es", autoDisplay: false },
        "google_translate_element",
      );
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
