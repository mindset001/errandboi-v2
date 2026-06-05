import { adminLogout } from "./login/actions";
import { AdminSidebarNav, AdminMobileNav } from "./AdminNav";
import { LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-800 bg-slate-900 fixed inset-y-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
          <span className="text-2xl">🛵</span>
          <div>
            <p className="font-extrabold text-orange-500 leading-none">Errandboi</p>
            <p className="text-xs text-slate-500 mt-0.5">Admin Panel</p>
          </div>
        </div>

        <AdminSidebarNav />

        <div className="p-3 border-t border-slate-800">
          <form action={adminLogout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛵</span>
          <span className="font-extrabold text-orange-500 text-sm">Admin</span>
        </div>
        <AdminMobileNav />
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
