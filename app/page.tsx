import { redirect } from "next/navigation";

// La página de inicio de la plantilla ya no se usa: la app vive en /protected
// (el proxy envía a /auth/login a quien no tenga sesión).
export default function Home() {
  redirect("/protected");
}
