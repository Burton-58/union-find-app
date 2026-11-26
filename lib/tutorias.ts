export type Role = "student" | "tutor" | "admin";

export type Persona = { id: string; nombre: string | null };

export type Calificacion = { promedio: number; total: number };

export type Resena = {
  id: string;
  rating: number;
  comentario: string | null;
  creada: string;
  actualizada: string;
  autor: Persona | null;
};

/** Una tutoría = una fila de `posts`, más el tutor, los cupos y su calificación. */
export type Tutoria = {
  id: string;
  materia: string;
  tutor: Persona | null;
  /** Calificación promedio del tutor (null si aún no tiene reseñas) */
  calificacion: Calificacion | null;
  /** ISO string; null si el tutor aún no define la fecha */
  fecha: string | null;
  cuposMax: number;
  inscritos: number;
  publicada: string;
};

/** Límites al crear una tutoría (deben coincidir con supabase/006_crear_tutoria.sql). */
export const MAX_CUPOS_TUTORIA = 50;
export const MAX_TUTORIAS_ABIERTAS = 10;

export function nombreDe(p: { nombre: string | null } | null | undefined) {
  return p?.nombre?.trim() || "Usuario sin nombre";
}

export function cuposLibres(t: Pick<Tutoria, "cuposMax" | "inscritos">) {
  return Math.max(t.cuposMax - t.inscritos, 0);
}

/** true si la sesión ya ocurrió (las tutorías sin fecha nunca "terminan"). */
export function haTerminado(t: Pick<Tutoria, "fecha">) {
  return t.fecha !== null && new Date(t.fecha).getTime() < Date.now();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (v: string) => UUID_RE.test(v);

const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const diasLargos = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const mesesLargos = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Las fechas se muestran siempre en hora de Costa Rica (UTC-6, sin horario de
// verano). Así el servidor (UTC) y el navegador muestran lo mismo y no hay
// errores de hidratación ni horas corridas.
const OFFSET_CR_MS = -6 * 60 * 60 * 1000;
const aCostaRica = (iso: string) => new Date(new Date(iso).getTime() + OFFSET_CR_MS);

function hora(d: Date) {
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

export function formatFechaCorta(iso: string | null) {
  if (!iso) return "Fecha por definir";
  const d = aCostaRica(iso);
  return `${dias[d.getUTCDay()]} ${d.getUTCDate()} ${meses[d.getUTCMonth()]} - ${hora(d)}`;
}

export function formatFechaLarga(iso: string | null) {
  if (!iso) return "Fecha por definir";
  const d = aCostaRica(iso);
  return `${diasLargos[d.getUTCDay()]} ${d.getUTCDate()} ${mesesLargos[d.getUTCMonth()]} • ${hora(d)}`;
}

/** "12 Nov 2026" (para reseñas) */
export function formatFechaDia(iso: string) {
  const d = aCostaRica(iso);
  return `${d.getUTCDate()} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

const COLORES_MATERIA = [
  "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300",
];

/** Color estable por materia (la base de datos no guarda códigos de curso). */
export function colorMateria(materia: string) {
  let h = 0;
  for (const c of materia.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES_MATERIA[h % COLORES_MATERIA.length];
}
