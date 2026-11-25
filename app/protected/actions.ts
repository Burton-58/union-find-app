"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esUuid } from "@/lib/tutorias";

export type Resultado = { ok: true } | { ok: false; error: string };

// Códigos que lanza public.join_post() -> mensajes para el usuario
const ERRORES_INSCRIPCION: Record<string, string> = {
  not_authenticated: "Vuelve a iniciar sesión.",
  post_not_found: "Esa tutoría ya no existe.",
  own_post: "No puedes inscribirte en tu propia tutoría.",
  session_ended: "Esta tutoría ya se realizó.",
  already_enrolled: "Ya estás inscrito en esta tutoría.",
  post_full: "Lo sentimos, la tutoría se acaba de llenar.",
};

export async function inscribirse(postId: string): Promise<Resultado> {
  if (!esUuid(postId)) return { ok: false, error: "Tutoría inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_post", { p_post_id: postId });
  if (error) {
    return {
      ok: false,
      error:
        ERRORES_INSCRIPCION[error.message] ??
        "No pudimos inscribirte. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/protected", "layout");
  return { ok: true };
}

export async function cancelarInscripcion(postId: string): Promise<Resultado> {
  if (!esUuid(postId)) return { ok: false, error: "Tutoría inválida." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { ok: false, error: "Vuelve a iniciar sesión." };

  // RLS también garantiza que solo puedes borrar tu propia inscripción.
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("post_id", postId)
    .eq("student_id", userId);
  if (error) {
    return { ok: false, error: "No pudimos cancelar tu inscripción. Inténtalo de nuevo." };
  }

  revalidatePath("/protected", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reseñas
// ---------------------------------------------------------------------------

export type ResenaFormState = { error?: string; guardada?: boolean };

// Códigos que lanza public.submit_review()
const ERRORES_RESENA: Record<string, string> = {
  not_authenticated: "Vuelve a iniciar sesión.",
  cannot_review_self: "No puedes calificarte a ti mismo.",
  tutor_not_found: "Ese tutor no existe.",
  invalid_rating: "Elige una calificación de 1 a 5 estrellas.",
  invalid_comment: "Tu comentario es muy largo (máximo 1000 caracteres).",
  not_eligible: "Puedes calificar a un tutor después de asistir a una de sus tutorías.",
};

export async function enviarResena(
  tutorId: string,
  _prev: ResenaFormState,
  formData: FormData,
): Promise<ResenaFormState> {
  if (!esUuid(tutorId)) return { error: "Tutor inválido." };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: ERRORES_RESENA.invalid_rating };
  }
  const comentario = String(formData.get("comment") ?? "").trim();
  if (comentario.length > 1000) return { error: ERRORES_RESENA.invalid_comment };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_tutor_id: tutorId,
    p_rating: rating,
    p_comment: comentario || null,
  });
  if (error) {
    return {
      error: ERRORES_RESENA[error.message] ?? "No pudimos guardar tu reseña. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/protected", "layout");
  return { guardada: true };
}

/** Elimina una reseña. RLS solo lo permite al autor o a un administrador. */
export async function eliminarResena(resenaId: string): Promise<Resultado> {
  if (!esUuid(resenaId)) return { ok: false, error: "Reseña inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", resenaId)
    .select("id");

  if (error) return { ok: false, error: "No pudimos eliminar la reseña. Inténtalo de nuevo." };
  if (!data || data.length === 0) {
    return { ok: false, error: "No tienes permiso para eliminar esa reseña." };
  }

  revalidatePath("/protected", "layout");
  return { ok: true };
}
