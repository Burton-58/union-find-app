import type { SupabaseClient } from "@supabase/supabase-js";
import type { Calificacion, Persona, Resena } from "@/lib/tutorias";

export const RESENAS_LIMITE = 50;

/** Promedio + cantidad para los tutores dados (los que no tienen reseñas no aparecen). */
export async function getCalificaciones(
  supabase: SupabaseClient,
  tutorIds: string[],
): Promise<Map<string, Calificacion>> {
  const mapa = new Map<string, Calificacion>();
  if (tutorIds.length === 0) return mapa;

  const { data, error } = await supabase
    .from("tutor_ratings")
    .select("tutor_id, avg_rating, review_count")
    .in("tutor_id", tutorIds);
  if (error) throw new Error(error.message);

  for (const fila of data ?? []) {
    mapa.set(fila.tutor_id as string, {
      promedio: Number(fila.avg_rating),
      total: Number(fila.review_count),
    });
  }
  return mapa;
}

type FilaResena = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  reviewer: { id: string; full_name: string | null } | null;
};

const RESENA_SELECT =
  "id, rating, comment, created_at, updated_at, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name)";

const aResena = (f: FilaResena): Resena => ({
  id: f.id,
  rating: f.rating,
  comentario: f.comment,
  creada: f.created_at,
  actualizada: f.updated_at,
  autor: f.reviewer
    ? ({ id: f.reviewer.id, nombre: f.reviewer.full_name } satisfies Persona)
    : null,
});

/** Reseñas más recientes de un tutor. */
export async function getResenas(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<Resena[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(RESENA_SELECT)
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false })
    .limit(RESENAS_LIMITE);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as FilaResena[]).map(aResena);
}

/** La reseña del usuario actual sobre este tutor (para poder editarla). */
export async function getResenaPropia(
  supabase: SupabaseClient,
  tutorId: string,
  usuarioId: string,
): Promise<Resena | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(RESENA_SELECT)
    .eq("tutor_id", tutorId)
    .eq("reviewer_id", usuarioId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aResena(data as unknown as FilaResena) : null;
}

/** La regla de elegibilidad vive en la base de datos (can_review_tutor). */
export async function puedeCalificar(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("can_review_tutor", {
    p_tutor_id: tutorId,
  });
  if (error) throw new Error(error.message);
  return data === true;
}
