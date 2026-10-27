import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background">
      {/* Las animaciones viven aquí mismopara no tocar otros archivos */}
      <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to   { transform: scale(1.08); }
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-24px); }
        }
        .animate-slow-zoom { animation: slow-zoom 24s ease-in-out infinite alternate; }
        .animate-card-in   { animation: card-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-float     { animation: float 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-slow-zoom, .animate-card-in, .animate-float { animation: none; }
        }
      `}</style>

      
      <div className="animate-float pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl" />
      <div
        className="animate-float pointer-events-none absolute bottom-10 left-1/4 h-56 w-56 rounded-full bg-red-400/20 blur-3xl"
        style={{ animationDelay: "-4s" }}
      />

      {/* Foto a la derechaa en pantallas medianas y grandes como el prototip (md) su borde izquierdo es curvo */}
      <div className="absolute inset-y-0 right-0 w-full overflow-hidden md:w-[72%] md:rounded-l-[50%]">
        <Image
          src="/images/login-bg.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 72vw, 100vw"
          className="animate-slow-zoom object-cover opacity-[0.55]"
        />
        {/* Degradado de color encima de la foto: azul arriba a la izquierda, rojo abajo a la derecha */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-transparent to-transparent" />
      </div>

      {/* nombre de la app, arriba a la izquierda */}
      <Link
        href="/"
        className="absolute left-6 top-6 z-10 text-lg font-semibold md:left-10 md:top-8"
      >
        Union-Find
      </Link>

      {/* Frase de apoyo, solo en pantallas medianas y grandes */}
      <p className="absolute bottom-10 left-10 z-10 hidden max-w-xs text-sm text-muted-foreground md:block">
        Encuentra tutores de tu institución o comparte lo que sabes con tus
        compañeros.
      </p>

      {/* El formulario, centrado, con su animación de entrada */}
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="animate-card-in w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
