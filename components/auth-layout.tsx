{/*con el fin de no hacer tantos cambios ya que varias pantallas se ven iguales*/}
import Image from "next/image";
import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <header className="flex h-12 w-full items-center bg-[#004AAD] px-6 md:px-10">
        {/* nombre de la app, arriba a la izquierda */}
        <Link href="/" className="text-lg font-semibold text-white">
          Union-Find
        </Link>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 md:p-10">
        {/* Foto a la derechaa en pantallas medianas y grandes como el prototip (md) su borde izquierdo es curvo */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[72%] md:[clip-path:ellipse(100%_106%_at_100%_50%)]">
          <Image
            src="/images/login-bg.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 72vw, 100vw"
            className="origin-[70%_50%] scale-125 object-cover opacity-[0.55]"
          />
          {/* Degradado de color encima de la foto: azul arriba a la izquierda, rojo abajo a la derecha */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-transparent to-transparent" />
        </div>

        {/* Frase de apoyo, solo en pantallas medianas y grandes */}
        <p className="absolute bottom-10 left-10 z-10 hidden max-w-xs text-sm text-muted-foreground md:block">
          Encuentra tutores de tu institución o comparte lo que sabes con tus
          compañeros.
        </p>

        {/* El formulario, centrado, con su animación de entrada */}
        <div className="relative z-10 w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
