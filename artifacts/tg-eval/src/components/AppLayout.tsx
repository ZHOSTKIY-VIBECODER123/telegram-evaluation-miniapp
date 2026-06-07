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
    <div className="min-h-[100dvh] bg-muted/20">
      <div className={showNav ? "pb-16" : ""}>{children}</div>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-background border-t z-50 flex safe-area-pb">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive(path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setLocation(path)}
            >
              <Icon
                className={`h-5 w-5 ${isActive(path) ? "stroke-[2.5]" : ""}`}
              />
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
