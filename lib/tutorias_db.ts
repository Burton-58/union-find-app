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

/** Tutorías en las que está inscrito este usuario. */
export async function getTutoriasInscritas(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<Tutoria[]> {
  const ids = [...(await getInscripciones(supabase, usuarioId))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(TUTORIA_SELECT)
    .in("id", ids);
  if (error) throw new Error(error.message);
  return conCalificaciones(
    supabase,
    ((data ?? []) as unknown as FilaTutoria[]).map(aTutoria),
  );
}

export type Estudiante = Persona & { desde: string };

/** Estudiantes inscritos en cada una de estas tutorías (para el tutor). */
export async function getInscritosPorTutoria(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<Map<string, Estudiante[]>> {
  const mapa = new Map<string, Estudiante[]>();
  if (postIds.length === 0) return mapa;
  const { data, error } = await supabase
    .from("enrollments")
    .select("post_id, created_at, student:profiles!enrollments_student_id_fkey(id, full_name)")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  type Fila = {
    post_id: string;
    created_at: string;
    student: { id: string; full_name: string | null } | null;
  };
  for (const f of (data ?? []) as unknown as Fila[]) {
    if (!f.student) continue;
    const lista = mapa.get(f.post_id) ?? [];
    lista.push({ id: f.student.id, nombre: f.student.full_name, desde: f.created_at });
    mapa.set(f.post_id, lista);
  }
  return mapa;
}

/** true si este usuario es dueño de al menos una tutoría. */
export async function tieneTutorias(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", usuarioId);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

/**
 * Tutor = rol tutor/admin O tener al menos una tutoría. Así un estudiante
 * que da tutorías no necesita una segunda cuenta.
 */
export async function calcularEsTutor(
  supabase: SupabaseClient,
  usuarioId: string,
  rol: Role,
): Promise<boolean> {
  return rol !== "student" || (await tieneTutorias(supabase, usuarioId));
}

export type Perfil = Persona & { rol: Role; esTutor: boolean };

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
  const rol = (data.role as Role) ?? "student";
  return {
    id: data.id,
    nombre: data.full_name,
    rol,
    esTutor: await calcularEsTutor(supabase, data.id, rol),
  };
}

export type Viewer = {
  id: string;
  email: string;
  nombre: string | null;
  rol: Role;
  esTutor: boolean;
};

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
    esTutor: perfil?.esTutor ?? false,
  };
}
