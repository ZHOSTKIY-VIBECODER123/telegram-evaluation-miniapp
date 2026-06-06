import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<any[]>([]);

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
        grouped[item.employee_name].totalAverage +=
          Number(item.average_score || 0);
      });

      const result = Object.values(grouped).map((item: any) => ({
        employee: item.employee,
        evaluations: item.evaluations,
        average:
          item.evaluations > 0
            ? (item.totalAverage / item.evaluations).toFixed(2)
            : "0",
      }));

      result.sort(
        (a: any, b: any) =>
          Number(b.average) - Number(a.average)
      );

      setStats(result);
    }

    loadData();
  }, []);

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <Button
        variant="ghost"
        className="mb-2 -ml-2"
        onClick={() => setLocation("/")}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад
      </Button>
      <h1 className="text-2xl font-bold">
        Аналитика сотрудников
      </h1>

      {stats.map((item) => (
      <Card
        key={item.employee}
        className="cursor-pointer hover:border-primary transition-colors"
        onClick={() =>
          setLocation(
            `/dashboard/${encodeURIComponent(item.employee)}`
          )
        }
      >
          <CardContent className="p-4">
            <div className="font-bold text-lg">
              {item.employee}
            </div>

            <div className="mt-2">
              Средний балл: {item.average}
            </div>

            <div className="text-muted-foreground">
              Оценок: {item.evaluations}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
