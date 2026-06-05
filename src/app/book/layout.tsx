import UserAppLayout from "@/components/layout/UserAppLayout";

export default async function BookLayout({ children }: { children: React.ReactNode }) {
  return <UserAppLayout>{children}</UserAppLayout>;
}
