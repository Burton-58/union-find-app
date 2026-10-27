"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Estado = "idle" | "enviando" | "enviada";

export function SolicitarButton({ disabled }: { disabled?: boolean }) {
  const [estado, setEstado] = useState<Estado>("idle");

  const solicitar = () => {
    setEstado("enviando");
    setTimeout(() => setEstado("enviada"), 1200);
  };

  return (
    <button
      type="button"
      onClick={solicitar}
      disabled={disabled || estado !== "idle"}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-300 active:scale-95",
        estado === "enviada" ? "bg-emerald-600" : "bg-sky-600 hover:bg-sky-700",
        "disabled:cursor-not-allowed",
        disabled && estado === "idle" && "bg-slate-400 hover:bg-slate-400"
      )}
    >
      {estado === "idle" && (
        <>
          <Send size={16} />
          {disabled ? "Sin cupos disponibles" : "Solicitar Unirse a Tutoría"}
        </>
      )}
      {estado === "enviando" && (
        <>
          <Loader2 size={16} className="animate-spin" />
          Enviando solicitud...
        </>
      )}
      {estado === "enviada" && (
        <span className="flex items-center gap-2 animate-in zoom-in-95 fade-in duration-300">
          <Check size={16} />
          Solicitud enviada
        </span>
      )}
    </button>
  );
}