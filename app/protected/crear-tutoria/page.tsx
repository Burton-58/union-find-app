import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { CrearTutoriaForm } from "@/components/tutorias/crear-tutoria-form";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/tutorias_db";

async function CrearTutoria() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect("/auth/login");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Link
        href="/protected"
        className="group flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Volver a tutorías
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Crear una tutoría</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comparte lo que sabes: publica una sesión y otros estudiantes podrán inscribirse.
        </p>
      </div>

      <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <CrearTutoriaForm />
      </section>

      {!viewer.esTutor && (
        <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
          <Info size={14} className="mt-0.5 shrink-0" />
          Al publicar tu primera tutoría tu cuenta pasa a ser de Estudiante y Tutor: seguirás
          pudiendo inscribirte en otras tutorías, y los demás podrán calificarte.
        </p>
      )}
    </div>
  );
}

export default function CrearTutoriaPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Cargando...</p>}>
      <CrearTutoria />
    </Suspense>
  );
}
