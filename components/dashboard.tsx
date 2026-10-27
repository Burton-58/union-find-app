"use client";

import { useMemo, useState } from "react";
import { Filter, Search, SearchX } from "lucide-react";
import { TutoriaCard } from "@/components/tutoria-card";
import { type Tutoria, cuposLibres, materias } from "@/lib/tutorias";

type Orden = "recientes" | "proximas" | "cupos" | "rating";

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function Dashboard({ tutorias }: { tutorias: Tutoria[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [materia, setMateria] = useState("todas");
  const [presencial, setPresencial] = useState(true);
  const [virtual, setVirtual] = useState(true);
  const [orden, setOrden] = useState<Orden>("recientes");

  const resultados = useMemo(() => {
    const q = normalizar(busqueda.trim());

    const filtradas = tutorias.filter((t) => {
      if (materia !== "todas" && t.materia !== materia) return false;
      if (t.modalidad === "presencial" && !presencial) return false;
      if (t.modalidad === "virtual" && !virtual) return false;
      if (!q) return true;
      return normalizar(`${t.titulo} ${t.tutor} ${t.codigo} ${t.materia}`).includes(q);
    });

    return filtradas.sort((a, b) => {
      if (orden === "proximas") return a.fecha.localeCompare(b.fecha);
      if (orden === "cupos") return cuposLibres(b) - cuposLibres(a);
      if (orden === "rating") return b.rating - a.rating;
      return b.publicada.localeCompare(a.publicada);
    });
  }, [tutorias, busqueda, materia, presencial, virtual, orden]);

  const limpiar = () => {
    setBusqueda("");
    setMateria("todas");
    setPresencial(true);
    setVirtual(true);
    setOrden("recientes");
  };

  const campo =
    "w-full rounded-lg border bg-muted/60 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-3xl font-bold tracking-tight">Encuentra tu tutoría</h1>
        <p className="mt-1 text-muted-foreground">
          Explora las sesiones publicadas por estudiantes del TEC y reserva tu cupo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-xl border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-left-3 duration-500 lg:sticky lg:top-24">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <Filter size={16} className="text-sky-600" />
            Filtros de Búsqueda
          </h2>

          <div className="flex flex-col gap-5">
            <div className="grid gap-1.5">
              <label htmlFor="materia" className="text-xs font-bold uppercase text-muted-foreground">
                Materia
              </label>
              <select
                id="materia"
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className={campo}
              >
                <option value="todas">Todas las materias</option>
                {materias.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">Modalidad</span>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={presencial}
                  onChange={(e) => setPresencial(e.target.checked)}
                  className="h-4 w-4 accent-sky-600"
                />
                Presencial (Cartago)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={virtual}
                  onChange={(e) => setVirtual(e.target.checked)}
                  className="h-4 w-4 accent-sky-600"
                />
                Virtual
              </label>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="orden" className="text-xs font-bold uppercase text-muted-foreground">
                Ordenar por
              </label>
              <select
                id="orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value as Orden)}
                className={campo}
              >
                <option value="recientes">Más recientes primero</option>
                <option value="proximas">Próximas primero</option>
                <option value="cupos">Más cupos disponibles</option>
                <option value="rating">Mejor calificados</option>
              </select>
            </div>

            <button
              type="button"
              onClick={limpiar}
              className="text-sm text-sky-700 underline-offset-4 transition hover:underline dark:text-sky-400"
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        <section className="flex flex-col gap-4">
          <div className="relative animate-in fade-in slide-in-from-top-2 duration-500">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por tema, profesor o código de materia (ej. CE-1102)..."
              className="w-full rounded-xl border bg-card py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {resultados.length} {resultados.length === 1 ? "tutoría encontrada" : "tutorías encontradas"}
          </p>

          {resultados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {resultados.map((t, i) => (
                <TutoriaCard key={t.id} tutoria={t} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card py-16 text-center animate-in fade-in zoom-in-95 duration-300">
              <SearchX size={36} className="text-muted-foreground" />
              <p className="font-semibold">No encontramos tutorías con esos filtros</p>
              <button
                type="button"
                onClick={limpiar}
                className="rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004a99] active:scale-95"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}