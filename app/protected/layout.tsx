import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { createClient } from "@/lib/supabase/server";
import { etiquetaRol } from "@/lib/roles";
import { getViewer } from "@/lib/tutorias_db";

async function Navbar() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);

  if (!viewer) {
    redirect("/auth/login");
  }

  return (
    <AppNavbar
      email={viewer.email}
      nombre={viewer.nombre}
      rol={etiquetaRol(viewer.rol, viewer.esTutor)}
      esAdmin={viewer.rol === "admin"}
    />
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-muted/40">
      <Suspense fallback={<div className="h-14 bg-[#003366]" />}>
        <Navbar />
      </Suspense>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}