export type Modalidad = "presencial" | "virtual";

export type Tutoria = {
  id: string;
  codigo: string;
  materia: string;
  titulo: string;
  tutor: string;
  tutorRol: string;
  rating: number;
  resenas: number;
  fecha: string;
  lugar: string;
  modalidad: Modalidad;
  cuposMax: number;
  inscritos: number;
  publicada: string;
  temas: string[];
};

export const tutorias: Tutoria[] = [
  {
    id: "1",
    codigo: "CE-1102",
    materia: "Estructuras de Datos y Algoritmos",
    titulo: "Repaso Estructuras de Datos y Grafos",
    tutor: "Laura Esquivel",
    tutorRol: "Estudiante Avanzado de Ing. en Computación",
    rating: 4.9,
    resenas: 12,
    fecha: "2026-10-28T14:00:00",
    lugar: "Aula D3-02",
    modalidad: "presencial",
    cuposMax: 5,
    inscritos: 2,
    publicada: "2026-10-24T09:00:00",
    temas: [
      "Representación de Grafos (Listas de Adyacencia)",
      "Algoritmos de Búsqueda BFS y DFS con ejemplos prácticos",
      "Resolución de dudas para el proyecto de clase",
    ],
  },
  {
    id: "2",
    codigo: "MA-1103",
    materia: "Cálculo",
    titulo: "Preparación para Parcial 2 - Integrales",
    tutor: "David Solano",
    tutorRol: "Estudiante Avanzado de Ing. en Electrónica",
    rating: 5.0,
    resenas: 8,
    fecha: "2026-10-29T16:00:00",
    lugar: "Teams / Virtual",
    modalidad: "virtual",
    cuposMax: 4,
    inscritos: 3,
    publicada: "2026-10-25T11:30:00",
    temas: [
      "Integración por partes y sustitución",
      "Integrales impropias",
      "Resolución de exámenes anteriores",
    ],
  },
  {
    id: "3",
    codigo: "FI-1201",
    materia: "Física General",
    titulo: "Cinemática y Movimiento en 2D",
    tutor: "Andrea Mora",
    tutorRol: "Estudiante Avanzado de Ing. en Producción",
    rating: 4.7,
    resenas: 9,
    fecha: "2026-10-30T10:00:00",
    lugar: "Laboratorio de Física, Edificio F2",
    modalidad: "presencial",
    cuposMax: 6,
    inscritos: 2,
    publicada: "2026-10-23T15:00:00",
    temas: [
      "Vectores y componentes",
      "Tiro parabólico",
      "Ejercicios tipo examen",
    ],
  },
  {
    id: "4",
    codigo: "QU-1101",
    materia: "Química I",
    titulo: "Estequiometría desde cero",
    tutor: "Sofía Chaves",
    tutorRol: "Estudiante Avanzado de Ing. en Materiales",
    rating: 4.8,
    resenas: 6,
    fecha: "2026-10-27T18:00:00",
    lugar: "Teams / Virtual",
    modalidad: "virtual",
    cuposMax: 8,
    inscritos: 8,
    publicada: "2026-10-22T08:00:00",
    temas: [
      "Balanceo de ecuaciones",
      "Reactivo limitante",
      "Rendimiento de reacción",
    ],
  },
  {
    id: "5",
    codigo: "CE-1103",
    materia: "Programación Orientada a Objetos",
    titulo: "Introducción a Recursividad y Patrones",
    tutor: "Mauricio Rojas",
    tutorRol: "Estudiante Avanzado de Ing. en Computación",
    rating: 4.6,
    resenas: 15,
    fecha: "2026-11-02T13:00:00",
    lugar: "Biblioteca TEC, Salón 3",
    modalidad: "presencial",
    cuposMax: 5,
    inscritos: 1,
    publicada: "2026-10-26T07:45:00",
    temas: [
      "Casos base y recursivos",
      "Patrones de diseño comunes",
      "Revisión de código en vivo",
    ],
  },
  {
    id: "6",
    codigo: "MA-1101",
    materia: "Álgebra Lineal",
    titulo: "Matrices y Determinantes",
    tutor: "Valeria Jiménez",
    tutorRol: "Estudiante Avanzado de Ing. Electromecánica",
    rating: 4.9,
    resenas: 11,
    fecha: "2026-11-03T15:30:00",
    lugar: "Teams / Virtual",
    modalidad: "virtual",
    cuposMax: 6,
    inscritos: 2,
    publicada: "2026-10-21T13:20:00",
    temas: [
      "Operaciones con matrices",
      "Determinantes y matriz inversa",
      "Sistemas de ecuaciones",
    ],
  },
];

export const materias = Array.from(new Set(tutorias.map((t) => t.materia))).sort();

export function getTutoria(id: string) {
  return tutorias.find((t) => t.id === id);
}

export function cuposLibres(t: Tutoria) {
  return Math.max(t.cuposMax - t.inscritos, 0);
}

const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const diasLargos = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const mesesLargos = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function hora(d: Date) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

export function formatFechaCorta(iso: string) {
  const d = new Date(iso);
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} - ${hora(d)}`;
}

export function formatFechaLarga(iso: string) {
  const d = new Date(iso);
  return `${diasLargos[d.getDay()]} ${d.getDate()} ${mesesLargos[d.getMonth()]} • ${hora(d)}`;
}

export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function colorMateria(codigo: string) {
  const prefijo = codigo.slice(0, 2);
  const colores: Record<string, string> = {
    CE: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    MA: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    FI: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
    QU: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  };
  return colores[prefijo] ?? "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300";
}