import UserAppLayout from "@/components/layout/UserAppLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserAppLayout>{children}</UserAppLayout>;
}
