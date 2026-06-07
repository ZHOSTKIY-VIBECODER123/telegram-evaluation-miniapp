import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<any[]>([]);
  const [tab, setTab] = useState("employees");

  useEffect(() => {
    async function loadData() {
      const { data } = await getSupabase()
        .from("evaluation_results")
        .select("*");

      if (!data) return;

      const grouped: Record<string, any> = {};

      data.forEach((item) => {
        if (!grouped[item.employee_name]) {
          grouped[item.employee_name] = {
            employee: item.employee_name,
            evaluations: 0,
            totalAverage: 0,
          };
        }

        grouped[item.employee_name].evaluations += 1;
        grouped[item.employee_name].totalAverage += Number(
          item.average_score || 0,
        );
      });

      const result = Object.values(grouped).map((item: any) => ({
        employee: item.employee,
        evaluations: item.evaluations,
        average:
          item.evaluations > 0
            ? (item.totalAverage / item.evaluations).toFixed(2)
            : "0",
      }));

      result.sort((a: any, b: any) => Number(b.average) - Number(a.average));

      setStats(result);
    }

    loadData();
  }, []);

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <header className="py-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Аналитика
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Средние баллы по сотрудникам
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTab("employees")}
            className={`px-3 py-2 rounded-lg text-sm ${
              tab === "employees"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            Сотрудники
          </button>

          <button
            onClick={() => setTab("questions")}
            className={`px-3 py-2 rounded-lg text-sm ${
              tab === "questions"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            Вопросы
          </button>
        </div>

        <div>{tab}</div>
      </header>

      {stats.length === 0 && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Данных пока нет.
        </div>
      )}

      {tab === "employees" &&
        stats.map((item) => (
          <Card
            key={item.employee}
            className="cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
            onClick={() =>
              setLocation(`/dashboard/${encodeURIComponent(item.employee)}`)
            }
          >
            <CardContent className="p-4">
              <div className="font-bold text-lg">{item.employee}</div>

              <div className="mt-2 font-medium">
                Средний балл: {item.average}
              </div>

              <div className="text-muted-foreground text-sm">
                Оценок: {item.evaluations}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
