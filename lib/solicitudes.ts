import type { SupabaseClient } from "@supabase/supabase-js";
import type { Persona } from "@/lib/tutorias";

export const MAX_SOLICITUDES_ABIERTAS = 5;
export const SOLICITUDES_LIMITE = 100;

export type Solicitud = {
  id: string;
  materia: string;
  detalle: string | null;
  resuelta: boolean;
  creada: string;
  autor: Persona | null;
};

type Fila = {
  id: string;
  subject: string;
  details: string | null;
  status: string;
  created_at: string;
  requester: { id: string; full_name: string | null } | null;
};

/** Solicitudes más recientes (abiertas primero). */
export async function getSolicitudes(supabase: SupabaseClient): Promise<Solicitud[]> {
  const { data, error } = await supabase
    .from("tutor_requests")
    .select(
      "id, subject, details, status, created_at, requester:profiles!tutor_requests_requester_id_fkey(id, full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(SOLICITUDES_LIMITE);
  if (error) throw new Error(error.message);

  const filas = ((data ?? []) as unknown as Fila[]).map<Solicitud>((f) => ({
    id: f.id,
    materia: f.subject,
    detalle: f.details,
    resuelta: f.status === "resolved",
    creada: f.created_at,
    autor: f.requester ? { id: f.requester.id, nombre: f.requester.full_name } : null,
  }));
  // Abiertas primero, sin depender del orden alfabético del estado
  return [...filas.filter((s) => !s.resuelta), ...filas.filter((s) => s.resuelta)];
}
