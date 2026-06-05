import { createAdminClient as createClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export default async function AdminUsersPage() {
  const supabase = createClient();

  const [
    { data: authData },
    { data: profiles },
    { data: orderStats },
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("*"),
    supabase.from("orders").select("user_id, fare, total, status"),
  ]);

  const authUsers = authData?.users ?? [];
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  function getUserStats(userId: string) {
    const userOrders = (orderStats ?? []).filter((o) => o.user_id === userId);
    const completed = userOrders.filter((o) => o.status === "completed");
    const spent = completed.reduce((sum, o) => sum + (o.fare || o.total || 0), 0);
    return { total: userOrders.length, completed: completed.length, spent };
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Users</h1>
        <p className="text-slate-400 mt-1 text-sm">{authUsers.length} registered customers</p>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Customer", "Phone", "Total Orders", "Completed", "Total Spent", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {authUsers.map((user) => {
                const profile = profileMap.get(user.id);
                const stats = getUserStats(user.id);
                const fullName = profile?.full_name || user.user_metadata?.full_name || "—";
                const phone = profile?.phone || user.user_metadata?.phone || "—";
                const joinedAt = user.created_at;

                return (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-100">{fullName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{phone}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-white">{stats.total}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-green-400 font-semibold">{stats.completed}</span>
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">
                      {formatCurrency(stats.spent)}
                    </td>
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      {new Date(joinedAt).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!authUsers.length && (
            <div className="text-center py-16 text-slate-500">No users yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
