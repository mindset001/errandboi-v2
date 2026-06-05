import UserAppLayout from "@/components/layout/UserAppLayout";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <UserAppLayout>{children}</UserAppLayout>;
}
