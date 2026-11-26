// Traducción de la página con el motor gratuito de Google Translate.
// El idioma elegido vive en la cookie "googtrans" (/es/en = español -> inglés),
// que es la misma que lee el script de Google al cargar.

export type Idioma = "es" | "en";

const COOKIE = "googtrans";

export function leerIdioma(): Idioma {
  if (typeof document === "undefined") return "es";
  return new RegExp(`(?:^|;\\s*)${COOKIE}=/es/en(?:;|$)`).test(document.cookie) ? "en" : "es";
}

/** Borra la cookie en el host actual y en sus dominios padre (Google la puede crear en cualquiera). */
function borrarCookie() {
  const caducada = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${COOKIE}=; path=/; ${caducada}`;
  const partes = location.hostname.split(".");
  for (let i = 0; i < partes.length - 1; i++) {
    const dominio = partes.slice(i).join(".");
    document.cookie = `${COOKIE}=; path=/; domain=${dominio}; ${caducada}`;
    document.cookie = `${COOKIE}=; path=/; domain=.${dominio}; ${caducada}`;
  }
}

/** Cambia el idioma y recarga la página (es lo más fiable con el traductor de Google). */
export function cambiarIdioma(idioma: Idioma) {
  if (idioma === "en") {
    document.cookie = `${COOKIE}=/es/en; path=/; max-age=31536000; samesite=lax`;
  } else {
    borrarCookie();
  }
  location.reload();
}
