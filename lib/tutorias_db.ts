import { createClient } from "@/lib/supabase/server";
import type { Tutoria } from "@/lib/tutorias";

type PostRow = {
  id: string;
  tutor_id: string;
  subject: string;
  capacity: number;
  session_date: string;
  created_at: string;
};

export async function getTutorias(): Promise<Tutoria[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, tutor_id, subject, capacity, session_date, created_at");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  const posts = data as PostRow[];
  const tutorIds = [...new Set(posts.map((p) => p.tutor_id).filter(Boolean))];
  const postIds = posts.map((p) => p.id);

  const [perfiles, inscripciones] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", tutorIds),
    supabase.from("enrollments").select("post_id").in("post_id", postIds),
  ]);

  if (perfiles.error) throw new Error(perfiles.error.message);
  if (inscripciones.error) throw new Error(inscripciones.error.message);

  const nombres = new Map<string, string>();
  for (const p of perfiles.data ?? []) {
    nombres.set(p.id, p.full_name);
  }

  const inscritos = new Map<string, number>();
  for (const e of inscripciones.data ?? []) {
    inscritos.set(e.post_id, (inscritos.get(e.post_id) ?? 0) + 1);
  }

  return posts.map(
    (p): Tutoria => ({
      id: p.id,
      codigo: "",
      materia: p.subject,
      titulo: p.subject,
      tutor: nombres.get(p.tutor_id) ?? "Tutor",
      tutorRol: "Tutor",
      rating: 0,
      resenas: 0,
      fecha: p.session_date,
      lugar: "Por definir",
      modalidad: "presencial",
      cuposMax: p.capacity,
      inscritos: inscritos.get(p.id) ?? 0,
      publicada: p.created_at,
      temas: [],
    }),
  );
}