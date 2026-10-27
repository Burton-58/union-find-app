import { AuthLayout } from "@/components/auth-layout";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}