import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import { getTutorias } from "@/lib/tutorias_db";

async function TutoriasLoader() {
  const tutorias = await getTutorias();
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