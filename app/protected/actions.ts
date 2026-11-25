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

// ---------------------------------------------------------------------------
// Solicitudes de tutoría ("Solicitar Tutor")
// ---------------------------------------------------------------------------

export type SolicitudFormState = { error?: string; creada?: boolean };

export async function crearSolicitud(
  _prev: SolicitudFormState,
  formData: FormData,
): Promise<SolicitudFormState> {
  const materia = String(formData.get("subject") ?? "").trim();
  const detalle = String(formData.get("details") ?? "").trim();

  if (materia.length < 3 || materia.length > 100) {
    return { error: "Escribe la materia o tema (entre 3 y 100 caracteres)." };
  }
  if (detalle.length > 500) {
    return { error: "El detalle es muy largo (máximo 500 caracteres)." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Vuelve a iniciar sesión." };

  const { error } = await supabase.from("tutor_requests").insert({
    requester_id: userId,
    subject: materia,
    details: detalle || null,
  });
  if (error) {
    // La política RLS rechaza la fila cuando ya hay 5 solicitudes abiertas
    return {
      error:
        "No pudimos publicar tu solicitud. Recuerda que puedes tener máximo 5 abiertas; marca alguna como resuelta e inténtalo de nuevo.",
    };
  }

  revalidatePath("/protected/solicitar-tutor");
  return { creada: true };
}

export async function resolverSolicitud(id: string): Promise<Resultado> {
  if (!esUuid(id)) return { ok: false, error: "Solicitud inválida." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_requests")
    .update({ status: "resolved" })
    .eq("id", id)
    .select("id");
  if (error || !data || data.length === 0) {
    return { ok: false, error: "No pudimos actualizar la solicitud." };
  }
  revalidatePath("/protected/solicitar-tutor");
  return { ok: true };
}

export async function eliminarSolicitud(id: string): Promise<Resultado> {
  if (!esUuid(id)) return { ok: false, error: "Solicitud inválida." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_requests")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || !data || data.length === 0) {
    return { ok: false, error: "No tienes permiso para eliminar esa solicitud." };
  }
  revalidatePath("/protected/solicitar-tutor");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Administración
// Las reglas viven en la base de datos (supabase/005_admin.sql): aunque alguien
// llame estas acciones sin ser administrador, la base de datos las rechaza.
// ---------------------------------------------------------------------------

// Códigos que lanzan public.admin_delete_post() / public.admin_delete_user()
const ERRORES_ADMIN: Record<string, string> = {
  not_authenticated: "Vuelve a iniciar sesión.",
  not_admin: "Solo los administradores pueden hacer esto.",
  post_not_found: "Esa tutoría ya no existe.",
  user_not_found: "Esa cuenta ya no existe.",
  cannot_delete_self: "No puedes eliminar tu propia cuenta.",
};

const errorAdmin = (codigo: string) =>
  ERRORES_ADMIN[codigo] ?? "No pudimos completar la acción. Inténtalo de nuevo.";

/** Elimina una tutoría y todas sus inscripciones. */
export async function eliminarTutoriaAdmin(postId: string): Promise<Resultado> {
  if (!esUuid(postId)) return { ok: false, error: "Tutoría inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_post", { p_post_id: postId });
  if (error) return { ok: false, error: errorAdmin(error.message) };

  revalidatePath("/protected", "layout");
  return { ok: true };
}

/** Elimina una cuenta completa (login, perfil, tutorías, inscripciones, reseñas). */
export async function eliminarUsuarioAdmin(userId: string): Promise<Resultado> {
  if (!esUuid(userId)) return { ok: false, error: "Usuario inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) return { ok: false, error: errorAdmin(error.message) };

  revalidatePath("/protected", "layout");
  return { ok: true };
}

/** Quita a un estudiante de una tutoría (la política RLS solo lo permite a admins). */
export async function quitarEstudianteAdmin(
  postId: string,
  studentId: string,
): Promise<Resultado> {
  if (!esUuid(postId) || !esUuid(studentId)) {
    return { ok: false, error: "Inscripción inválida." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .delete()
    .eq("post_id", postId)
    .eq("student_id", studentId)
    .select("id");

  if (error) return { ok: false, error: "No pudimos quitar al estudiante. Inténtalo de nuevo." };
  if (!data || data.length === 0) {
    return { ok: false, error: "No tienes permiso o el estudiante ya no está inscrito." };
  }

  revalidatePath("/protected", "layout");
  return { ok: true };
}
