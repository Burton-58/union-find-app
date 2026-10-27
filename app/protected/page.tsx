import { Dashboard } from "@/components/dashboard";
import { tutorias } from "@/lib/tutorias";

export default function ProtectedPage() {
  return <Dashboard tutorias={tutorias} />;
}