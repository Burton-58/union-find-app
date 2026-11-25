import type { Role } from "@/lib/tutorias";

export const ROLES: Record<Role, string> = {
  student: "Estudiante",
  tutor: "Tutor",
  admin: "Administrador",
};

/**
 * Etiqueta que se muestra al usuario. "Tutor" no es un rol que haya que
 * pedir: cualquiera que tenga al menos una tutoría publicada lo es, así que
 * un estudiante con tutorías aparece como "Estudiante y Tutor".
 */
export function etiquetaRol(rol: Role, esTutor: boolean) {
  if (rol === "student" && esTutor) return "Estudiante y Tutor";
  return ROLES[rol];
}
