import { auth } from "@/auth";
import { ForgotPasswordForm } from "../_components/forgot-password-form";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session) {
    redirect("/login");
  }
  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] shadow-md rounded-lg bg-white dark:bg-slate-900 p-8">
        <div className="flex flex-col space-y-2 text-center">
          <div className="w-full flex justify-center items-center">
            <Image
              src="/assets/puntland_logo.svg"
              alt="Puntland Coat of Arms"
              width={100}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground">
            {` Enter your email address and we'll send you a link to reset your password.`}
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
