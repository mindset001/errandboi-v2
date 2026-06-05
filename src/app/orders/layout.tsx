import UserAppLayout from "@/components/layout/UserAppLayout";

export default async function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <UserAppLayout>{children}</UserAppLayout>;
}
