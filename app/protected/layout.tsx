import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { createClient } from "@/lib/supabase/server";

async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  if (!email) {
    redirect("/auth/login");
  }

  return <AppNavbar email={email} />;
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