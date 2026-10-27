"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { iniciales } from "@/lib/tutorias";
import { cn } from "@/lib/utils";

const links = [
  { href: "/protected", label: "Inicio", ready: true },
  { href: "/protected/mis-tutorias", label: "Mis Tutorías", ready: false },
  { href: "/protected/solicitar-tutor", label: "Solicitar Tutor", ready: false },
  { href: "/protected/perfil", label: "Mi Perfil", ready: false },
];

function nombreDesdeCorreo(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function AppNavbar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const nombre = nombreDesdeCorreo(email);

  const cerrarSesion = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#003366] text-white shadow-md animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-3 md:px-8">
        <Link
          href="/protected"
          className="text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          Union-Find
        </Link>

        <nav className="order-last flex w-full items-center gap-6 overflow-x-auto pb-1 md:order-none md:w-auto md:flex-1 md:overflow-visible md:pb-0">
          {links.map((link) => {
            const activo =
              link.href === "/protected"
                ? pathname === "/protected" || pathname.startsWith("/protected/tutoria")
                : pathname.startsWith(link.href);

            return link.ready ? (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative whitespace-nowrap py-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-sky-400 after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100",
                  activo ? "text-white after:scale-x-100" : "text-white/70"
                )}
              >
                {link.label}
              </Link>
            ) : (
              <span
                key={link.href}
                title="Próximamente"
                className="cursor-not-allowed whitespace-nowrap py-1 text-sm font-medium text-white/40"
              >
                {link.label}
              </span>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/85 sm:inline">
            Hola, {nombre} (Estudiante)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold ring-2 ring-white/20 transition-transform hover:scale-105">
            {iniciales(nombre)}
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white active:scale-90"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}