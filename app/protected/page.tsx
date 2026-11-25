import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getTutorias } from "@/lib/tutorias_db";

async function TutoriasLoader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/auth/login");

  const tutorias = await getTutorias(supabase);
  return <Dashboard tutorias={tutorias} />;
}

export default function ProtectedPage() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground">Cargando tutorías...</p>}
    >
      <TutoriasLoader />
    </Suspense>
  );
}
