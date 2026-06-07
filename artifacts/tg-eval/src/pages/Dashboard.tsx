import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";

type EvalRecord = {
  id: string;
  checklist_name: string;
  employee_name: string;
  employee_role: string;
  evaluator_name: string;
  total_score: number;
  average_score: number;
  answers: any[];
  created_at: string;
};

const TABS = [
  { key: "employees", label: "Сотрудники" },
  { key: "questions", label: "Вопросы" },
  { key: "checklists", label: "Чек-листы" },
  { key: "history", label: "История" },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [rawData, setRawData] = useState<EvalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("employees");

  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterChecklist, setFilterChecklist] = useState("");
  const [filterEvaluator, setFilterEvaluator] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .order("created_at", { ascending: false });
      setRawData(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const uniqueEmployees = useMemo(
    () => [...new Set(rawData.map((r) => r.employee_name))].sort(),
    [rawData],
  );
  const uniqueChecklists = useMemo(
    () => [...new Set(rawData.map((r) => r.checklist_name))].sort(),
    [rawData],
  );
  const uniqueEvaluators = useMemo(
    () =>
      [...new Set(rawData.map((r) => r.evaluator_name).filter(Boolean))].sort(),
    [rawData],
  );

  const filtered = useMemo(
    () =>
      rawData.filter((r) => {
        if (filterEmployee && r.employee_name !== filterEmployee) return false;
        if (filterChecklist && r.checklist_name !== filterChecklist)
          return false;
        if (filterEvaluator && r.evaluator_name !== filterEvaluator)
          return false;
        return true;
      }),
    [rawData, filterEmployee, filterChecklist, filterEvaluator],
  );

  const kpi = useMemo(() => {
    const total = filtered.length;
    const avg =
      total > 0
        ? (
            filtered.reduce((s, r) => s + Number(r.average_score || 0), 0) /
            total
          ).toFixed(2)
        : "—";
    const employees = new Set(filtered.map((r) => r.employee_name)).size;
    return { total, avg, employees };
  }, [filtered]);

  const employeeStats = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      if (!grouped[r.employee_name])
        grouped[r.employee_name] = { total: 0, count: 0 };
      grouped[r.employee_name].total += Number(r.average_score || 0);
      grouped[r.employee_name].count += 1;
    });
    return Object.entries(grouped)
      .map(([name, { total, count }]) => ({
        name,
        count,
        avg: count > 0 ? (total / count).toFixed(2) : "0",
      }))
      .sort((a, b) => Number(b.avg) - Number(a.avg));
  }, [filtered]);

  const questionStats = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      const answers = Array.isArray(r.answers) ? r.answers : [];
      answers.forEach((a: any) => {
        const q = a.question || "Без названия";
        if (!grouped[q]) grouped[q] = { total: 0, count: 0 };
        if (a.score !== null && a.score !== undefined) {
          grouped[q].total += Number(a.score);
          grouped[q].count += 1;
        }
      });
    });
    return Object.entries(grouped)
      .map(([question, { total, count }]) => ({
        question,
        count,
        avg: count > 0 ? (total / count).toFixed(2) : "—",
      }))
      .sort((a, b) => Number(a.avg) - Number(b.avg));
  }, [filtered]);

  const checklistStats = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      if (!grouped[r.checklist_name])
        grouped[r.checklist_name] = { total: 0, count: 0 };
      grouped[r.checklist_name].total += Number(r.average_score || 0);
      grouped[r.checklist_name].count += 1;
    });
    return Object.entries(grouped)
      .map(([name, { total, count }]) => ({
        name,
        count,
        avg: count > 0 ? (total / count).toFixed(2) : "0",
      }))
      .sort((a, b) => Number(b.avg) - Number(a.avg));
  }, [filtered]);

  const tabBtn = (key: string, label: string) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        tab === key
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  const exportCSV = () => {
    const BOM = "﻿";
    const headers = ["Дата", "Оценщик", "Сотрудник", "Чек-лист", "Средний балл", "Итоговый балл"];
    const rows = filtered.map((r) => [
      new Date(r.created_at).toLocaleString("ru-RU"),
      r.evaluator_name || "",
      r.employee_name,
      r.checklist_name,
      String(r.average_score),
      String(r.total_score),
    ]);
    const csv = BOM + [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `оценки_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreColor = (avg: string) => {
    const n = Number(avg);
    if (n >= 2.5) return "text-green-600";
    if (n >= 1.5) return "text-yellow-600";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <header className="py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Аналитика
        </h1>
        <Button variant="outline" size="sm" onClick={exportCSV} className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black">{kpi.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Оценок</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className={`text-2xl font-black ${scoreColor(kpi.avg)}`}>
              {kpi.avg}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Средний</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black">{kpi.employees}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Сотрудников
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <select
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">Все сотрудники</option>
          {uniqueEmployees.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          value={filterChecklist}
          onChange={(e) => setFilterChecklist(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">Все чек-листы</option>
          {uniqueChecklists.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterEvaluator}
          onChange={(e) => setFilterEvaluator(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">Все оценщики</option>
          {uniqueEvaluators.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(({ key, label }) => tabBtn(key, label))}
      </div>

      {tab === "employees" && (
        <div className="space-y-3">
          {employeeStats.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Нет данных
            </p>
          )}
          {employeeStats.map((item) => (
            <Card
              key={item.name}
              className="cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
              onClick={() =>
                setLocation(`/dashboard/${encodeURIComponent(item.name)}`)
              }
            >
              <CardContent className="p-4">
                <div className="font-bold">{item.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    Оценок: {item.count}
                  </span>
                  <span className={`font-bold text-lg ${scoreColor(item.avg)}`}>
                    {item.avg}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "questions" && (
        <div className="space-y-3">
          {questionStats.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Нет данных
            </p>
          )}
          {questionStats.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="text-sm font-medium leading-snug">
                  {item.question}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    Ответов: {item.count}
                  </span>
                  <span
                    className={`font-bold text-lg ${scoreColor(item.avg)}`}
                  >
                    {item.avg}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "checklists" && (
        <div className="space-y-3">
          {checklistStats.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Нет данных
            </p>
          )}
          {checklistStats.map((item) => (
            <Card key={item.name}>
              <CardContent className="p-4">
                <div className="font-bold">{item.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    Оценок: {item.count}
                  </span>
                  <span className={`font-bold text-lg ${scoreColor(item.avg)}`}>
                    {item.avg}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Нет данных
            </p>
          )}
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
              onClick={() => setLocation(`/history/${item.id}`)}
            >
              <CardContent className="p-4">
                <div className="font-semibold">
                  {item.evaluator_name} → {item.employee_name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {item.checklist_name}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                  <span
                    className={`font-bold ${scoreColor(String(item.average_score))}`}
                  >
                    {item.average_score}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
