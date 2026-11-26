import { Star } from "lucide-react";
import type { Calificacion } from "@/lib/tutorias";
import { cn } from "@/lib/utils";

export function Estrellas({ valor, size = 14 }: { valor: number; size?: number }) {
  const llenas = Math.round(valor);
  return (
    <span
      role="img"
      aria-label={`${valor.toFixed(1)} de 5 estrellas`}
      className="inline-flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          aria-hidden
          className={cn(
            n <= llenas ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

export function ResumenCalificacion({
  calificacion,
  mostrarVacio = true,
  size = 14,
}: {
  calificacion: Calificacion | null | undefined;
  mostrarVacio?: boolean;
  size?: number;
}) {
  if (!calificacion || calificacion.total === 0) {
    return mostrarVacio ? (
      <span className="text-xs text-muted-foreground">Sin reseñas aún</span>
    ) : null;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Estrellas valor={calificacion.promedio} size={size} />
      <span className="font-bold text-amber-500">{calificacion.promedio.toFixed(1)}</span>
      <span>
        ({calificacion.total} {calificacion.total === 1 ? "reseña" : "reseñas"})
      </span>
    </span>
  );
}
