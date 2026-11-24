import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import { PerfilNombreForm } from "@/components/perfil-nombre-form";
import { createClient } from "@/lib/supabase/server";
import { iniciales } from "@/lib/tutorias";

const roles: Record<string, string> = {
  student: "Estudiante",
  tutor: "Tutor",
  admin: "Administrador",
};

async function PerfilContenido() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/auth/login");
  }

  const email = (claims.email as string | undefined) ?? "";

  const { data: fila, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", claims.sub)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const nombreGuardado: string = fila?.full_name ?? "";
  const nombre = nombreGuardado || email.split("@")[0];
  const rol = roles[fila?.role ?? "student"] ?? "Estudiante";

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="mt-1 text-muted-foreground">
          Consulta la información de tu cuenta en Union-Find.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="flex h-fit flex-col items-center gap-1 rounded-2xl border bg-card p-6 text-center shadow-sm animate-in fade-in slide-in-from-left-3 duration-500">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#003366] text-3xl font-bold text-white shadow-md transition-transform duration-300 hover:scale-105">
            {iniciales(nombre)}
          </div>
          <h2 className="mt-3 text-xl font-bold">{nombre}</h2>
          <span className="mt-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
            {rol}
          </span>
        </aside>

        <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500 md:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Información personal
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <PerfilNombreForm
              userId={claims.sub}
              nombreInicial={nombreGuardado}
            />

            <div className="rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Mail size={14} className="text-sky-600" />
                Correo electrónico
              </p>
              <p className="mt-1 break-all text-sm font-bold">{email}</p>
            </div>

            <div className="rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <ShieldCheck size={14} className="text-sky-600" />
                Rol en la plataforma
              </p>
              <p className="mt-1 text-sm font-bold">{rol}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground">Cargando perfil...</p>}
    >
      <PerfilContenido />
    </Suspense>
  );
}