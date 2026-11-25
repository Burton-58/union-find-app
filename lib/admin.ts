import type { SupabaseClient } from "@supabase/supabase-js";
import type { Persona, Role, Tutoria } from "@/lib/tutorias";

export const RESENAS_ADMIN_LIMITE = 50;

export type UsuarioAdmin = {
  id: string;
  nombre: string | null;
  rol: Role;
  /** Cuántas tutorías tiene publicadas */
  tutorias: number;
  esTutor: boolean;
};

/** Todos los perfiles, con cuántas tutorías tiene cada uno. */
export async function getUsuarios(
  supabase: SupabaseClient,
  tutorias: Tutoria[],
): Promise<UsuarioAdmin[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);

  const porTutor = new Map<string, number>();
  for (const t of tutorias) {
    if (t.tutor) porTutor.set(t.tutor.id, (porTutor.get(t.tutor.id) ?? 0) + 1);
  }

  return (data ?? []).map((p) => {
    const rol = (p.role as Role) ?? "student";
    const n = porTutor.get(p.id as string) ?? 0;
    return {
      id: p.id as string,
      nombre: p.full_name as string | null,
      rol,
      tutorias: n,
      esTutor: rol === "tutor" || n > 0,
    };
  });
}

export type ResenaAdmin = {
  id: string;
  rating: number;
  comentario: string | null;
  creada: string;
  tutor: Persona | null;
  autor: Persona | null;
};

type FilaResenaAdmin = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  tutor: { id: string; full_name: string | null } | null;
  reviewer: { id: string; full_name: string | null } | null;
};

const aPersona = (p: { id: string; full_name: string | null } | null): Persona | null =>
  p ? { id: p.id, nombre: p.full_name } : null;

/** Las reseñas más recientes de toda la plataforma (para moderar). */
export async function getTodasLasResenas(supabase: SupabaseClient): Promise<ResenaAdmin[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, tutor:profiles!reviews_tutor_id_fkey(id, full_name), reviewer:profiles!reviews_reviewer_id_fkey(id, full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(RESENAS_ADMIN_LIMITE);
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as FilaResenaAdmin[]).map((f) => ({
    id: f.id,
    rating: f.rating,
    comentario: f.comment,
    creada: f.created_at,
    tutor: aPersona(f.tutor),
    autor: aPersona(f.reviewer),
  }));
}
