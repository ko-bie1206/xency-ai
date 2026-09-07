import { ClientsProvider } from "@/lib/ClientsContext";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientsProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <div id="content">{children}</div>
        </div>
      </div>
    </ClientsProvider>
  );
}
