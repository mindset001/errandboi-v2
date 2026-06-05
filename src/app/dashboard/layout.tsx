import UserAppLayout from "@/components/layout/UserAppLayout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserAppLayout>{children}</UserAppLayout>;
}
