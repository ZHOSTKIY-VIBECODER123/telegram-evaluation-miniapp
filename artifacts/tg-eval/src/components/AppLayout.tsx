import { useLocation } from "wouter";
import { ClipboardList, History, BarChart2, Settings } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Оценка", icon: ClipboardList },
  { path: "/history", label: "История", icon: History },
  { path: "/dashboard", label: "Аналитика", icon: BarChart2 },
  { path: "/settings", label: "Настройки", icon: Settings },
];

const HIDDEN_NAV_ROUTES = ["/employees", "/evaluate", "/results"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  const showNav = !HIDDEN_NAV_ROUTES.includes(location);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location === path || location.startsWith(path + "/");
  };

  return (
    <div className="min-h-[100dvh]" style={{ background: "hsl(240 5% 96%)" }}>
      <div className={showNav ? "pb-28" : ""}>{children}</div>

      {showNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-6 pointer-events-none">
          <nav
            className="pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-[28px]"
            style={{
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(24px) saturate(200%)",
              WebkitBackdropFilter: "blur(24px) saturate(200%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.6) inset, 0 0 0 0.5px rgba(0,0,0,0.08)",
            }}
          >
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <button
                  key={path}
                  onClick={() => setLocation(path)}
                  className="relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-[20px] transition-all duration-200 active:scale-95"
                  style={{
                    background: active ? "rgba(0,122,255,0.12)" : "transparent",
                    minWidth: 64,
                  }}
                >
                  <Icon
                    className="h-[22px] w-[22px] transition-colors duration-200"
                    style={{
                      color: active ? "#007AFF" : "rgba(60,60,67,0.45)",
                      strokeWidth: active ? 2.5 : 1.8,
                    }}
                  />
                  <span
                    className="text-[10px] font-medium tracking-tight transition-colors duration-200"
                    style={{ color: active ? "#007AFF" : "rgba(60,60,67,0.5)" }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
