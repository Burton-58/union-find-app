import type { SupabaseClient } from "@supabase/supabase-js";
import { getCalificaciones } from "@/lib/resenas";
import type { Persona, Role, Tutoria } from "@/lib/tutorias";

type FilaTutoria = {
  id: string;
  subject: string;
  capacity: number;
  session_date: string | null;
  created_at: string;
  tutor: { id: string; full_name: string | null } | null;
  enrollments: { count: number }[];
};

const TUTORIA_SELECT =
  "id, subject, capacity, session_date, created_at, tutor:profiles!posts_tutor_id_fkey(id, full_name), enrollments(count)";

const aTutoria = (f: FilaTutoria): Tutoria => ({
  id: f.id,
  materia: f.subject,
  tutor: f.tutor ? { id: f.tutor.id, nombre: f.tutor.full_name } : null,
  calificacion: null,
  fecha: f.session_date,
  cuposMax: f.capacity,
  inscritos: f.enrollments?.[0]?.count ?? 0,
  publicada: f.created_at,
});

/** Agrega la calificación de cada tutor (una sola consulta extra). */
async function conCalificaciones(
  supabase: SupabaseClient,
  tutorias: Tutoria[],
): Promise<Tutoria[]> {
  const ids = [
    ...new Set(tutorias.map((t) => t.tutor?.id).filter((id): id is string => !!id)),
  ];
  const calificaciones = await getCalificaciones(supabase, ids);
  return tutorias.map((t) => ({
    ...t,
    calificacion: t.tutor ? (calificaciones.get(t.tutor.id) ?? null) : null,
  }));
}

export async function getTutorias(supabase: SupabaseClient): Promise<Tutoria[]> {
  const { data, error } = await supabase.from("posts").select(TUTORIA_SELECT);
  if (error) throw new Error(error.message);
  return conCalificaciones(
    supabase,
    ((data ?? []) as unknown as FilaTutoria[]).map(aTutoria),
  );
}

export async function getTutoria(
  supabase: SupabaseClient,
  id: string,
): Promise<Tutoria | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(TUTORIA_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [tutoria] = await conCalificaciones(supabase, [
    aTutoria(data as unknown as FilaTutoria),
  ]);
  return tutoria;
}

export async function getTutoriasDeTutor(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<Tutoria[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(TUTORIA_SELECT)
    .eq("tutor_id", tutorId);
  if (error) throw new Error(error.message);
  return conCalificaciones(
    supabase,
    ((data ?? []) as unknown as FilaTutoria[]).map(aTutoria),
  );
}

/** Ids de las tutorías en las que está inscrito este usuario. */
export async function getInscripciones(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("post_id")
    .eq("student_id", usuarioId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.post_id as string));
}

export type Perfil = Persona & { rol: Role };

export async function getPerfil(
  supabase: SupabaseClient,
  id: string,
): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { id: data.id, nombre: data.full_name, rol: (data.role as Role) ?? "student" };
}

export type Viewer = { id: string; email: string; nombre: string | null; rol: Role };

/** El usuario con sesión iniciada (claims verificados) + su perfil, o null. */
export async function getViewer(supabase: SupabaseClient): Promise<Viewer | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const perfil = await getPerfil(supabase, claims.sub);
  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    nombre: perfil?.nombre ?? null,
    rol: perfil?.rol ?? "student",
  };
}
