import { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function EmployeeAnalytics() {
  const [, params] = useRoute("/dashboard/:employee");
  const [, setLocation] = useLocation();
  const [evaluations, setEvaluations] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!params?.employee) return;
      const employeeName = decodeURIComponent(params.employee);
      const { data } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .eq("employee_name", employeeName)
        .order("created_at", { ascending: true });
      setEvaluations(data || []);
    }
    loadData();
  }, [params]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, { total: number; count: number }> = {};
    evaluations.forEach((r) => {
      const key = format(parseISO(r.created_at), "MMM yyyy", { locale: ru });
      if (!byMonth[key]) byMonth[key] = { total: 0, count: 0 };
      byMonth[key].total += Number(r.average_score || 0);
      byMonth[key].count += 1;
    });
    return Object.entries(byMonth).map(([month, { total, count }]) => ({
      month,
      avg: Number((total / count).toFixed(2)),
    }));
  }, [evaluations]);

  const overallAvg = useMemo(() => {
    if (evaluations.length === 0) return null;
    const sum = evaluations.reduce((s, r) => s + Number(r.average_score || 0), 0);
    return (sum / evaluations.length).toFixed(2);
  }, [evaluations]);

  if (!params?.employee) return null;
  const employeeName = decodeURIComponent(params.employee);

  const scoreColor = (v: number) => {
    if (v >= 2.5) return "text-green-600";
    if (v >= 1.5) return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <Button variant="ghost" className="mb-2 -ml-2" onClick={() => setLocation("/dashboard")}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад
      </Button>

      <h1 className="text-2xl font-bold">{employeeName}</h1>

      {overallAvg !== null && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-black ${scoreColor(Number(overallAvg))}`}>{overallAvg}</div>
              <div className="text-xs text-muted-foreground mt-1">Средний балл</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-black">{evaluations.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Оценок</div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartData.length >= 2 ? (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Динамика</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                  formatter={(v: number) => [v, "Средний балл"]}
                />
                <ReferenceLine y={2.5} stroke="hsl(var(--primary))" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 5, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 text-center">— пунктир: целевой порог 2.5</p>
          </CardContent>
        </Card>
      ) : chartData.length === 1 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Недостаточно данных для графика (нужны оценки в разные месяцы).
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {[...evaluations].reverse().map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="font-semibold">{item.checklist_name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {item.evaluator_name} → {item.employee_name}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </span>
                <span className={`font-bold text-lg ${scoreColor(Number(item.average_score))}`}>
                  {item.average_score}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
