import { ClientsProvider } from "@/lib/ClientsContext";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <ClientsProvider>
      <div className="app-shell">
        <Sidebar userEmail={session?.user?.email ?? null} />
        <div className="main-area">
          <div id="content">{children}</div>
        </div>
      </div>
    </ClientsProvider>
  );
}
