import { ReactNode } from "react";

import AppShell from "@/components/layout/app-shell";
import AuthGuard from "@/components/auth-guard";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({
  children,
}: LayoutProps) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}