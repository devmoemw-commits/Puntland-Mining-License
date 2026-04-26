import { auth } from "@/auth";
import LayoutClient from "@/components/LayoutClient";
import React, { ReactNode } from "react";
import SignInForm from "../(auth)/_components/signin-form";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth()

  if (!session) {
    return <SignInForm />;
  }

  return (
    <>
      <LayoutClient session={session}>
        {children}
      </LayoutClient>
    </>
  );
};

export default Layout;