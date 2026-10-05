import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationsList from "@/components/notifications/NotificationsList";
import PushSubscriber from "@/components/PushSubscriber";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Updates on your orders and payments</p>
        </div>
        <PushSubscriber />
      </div>
      <NotificationsList userId={user.id} />
    </div>
  );
}
