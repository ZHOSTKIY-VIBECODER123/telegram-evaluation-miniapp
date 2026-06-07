import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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

const scoreColor = (avg: string | number) => {
  const n = Number(avg);
  if (n >= 2.5) return "#34C759";
  if (n >= 1.5) return "#FF9500";
  return "#FF3B30";
};

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

  const uniqueEmployees = useMemo(() => [...new Set(rawData.map((r) => r.employee_name))].sort(), [rawData]);
  const uniqueChecklists = useMemo(() => [...new Set(rawData.map((r) => r.checklist_name))].sort(), [rawData]);
  const uniqueEvaluators = useMemo(() => [...new Set(rawData.map((r) => r.evaluator_name).filter(Boolean))].sort(), [rawData]);

  const filtered = useMemo(() =>
    rawData.filter((r) => {
      if (filterEmployee && r.employee_name !== filterEmployee) return false;
      if (filterChecklist && r.checklist_name !== filterChecklist) return false;
      if (filterEvaluator && r.evaluator_name !== filterEvaluator) return false;
      return true;
    }),
    [rawData, filterEmployee, filterChecklist, filterEvaluator]
  );

  const kpi = useMemo(() => {
    const total = filtered.length;
    const avg = total > 0 ? (filtered.reduce((s, r) => s + Number(r.average_score || 0), 0) / total).toFixed(1) : "—";
    const employees = new Set(filtered.map((r) => r.employee_name)).size;
    return { total, avg, employees };
  }, [filtered]);

  const employeeStats = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      if (!grouped[r.employee_name]) grouped[r.employee_name] = { total: 0, count: 0 };
      grouped[r.employee_name].total += Number(r.average_score || 0);
      grouped[r.employee_name].count += 1;
    });
    return Object.entries(grouped)
      .map(([name, { total, count }]) => ({ name, count, avg: count > 0 ? (total / count).toFixed(1) : "0" }))
      .sort((a, b) => Number(b.avg) - Number(a.avg));
  }, [filtered]);

  const questionStats = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      (Array.isArray(r.answers) ? r.answers : []).forEach((a: any) => {
        const q = a.question || "Без названия";
        if (!grouped[q]) grouped[q] = { total: 0, count: 0 };
        if (a.score !== null && a.score !== undefined) {
          grouped[q].total += Number(a.score);
          grouped[q].count += 1;
        }
      });
    });
    return Object.entries(grouped)
      .map(([question, { total, count }]) => ({ question, count, avg: count > 0 ? (total / count).toFixed(1) : "—" }))
      .sort((a, b) => Number(a.avg) - Number(b.avg));
  }, [filtered]);

  const checklistStats = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    filtered.forEach((r) => {
      if (!grouped[r.checklist_name]) grouped[r.checklist_name] = { total: 0, count: 0 };
      grouped[r.checklist_name].total += Number(r.average_score || 0);
      grouped[r.checklist_name].count += 1;
    });
    return Object.entries(grouped)
      .map(([name, { total, count }]) => ({ name, count, avg: count > 0 ? (total / count).toFixed(1) : "0" }))
      .sort((a, b) => Number(b.avg) - Number(a.avg));
  }, [filtered]);

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh]">
      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-[34px] font-bold" style={{ color: "#000", letterSpacing: "-0.5px" }}>Аналитика</h1>
      </header>

      <div className="px-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
          </div>
        ) : (
          <>
            {/* KPI */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: kpi.total, label: "Оценок" },
                { value: kpi.avg, label: "Средний", color: scoreColor(kpi.avg) },
                { value: kpi.employees, label: "Сотрудников" },
              ].map(({ value, label, color }) => (
                <div key={label} className="rounded-[18px] p-3 text-center" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div className="text-[26px] font-bold" style={{ color: color || "#000", letterSpacing: "-0.5px" }}>{value}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(60,60,67,0.5)" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {[
                { value: filterEmployee, onChange: setFilterEmployee, placeholder: "Все сотрудники", options: uniqueEmployees },
                { value: filterChecklist, onChange: setFilterChecklist, placeholder: "Все чек-листы", options: uniqueChecklists },
                { value: filterEvaluator, onChange: setFilterEvaluator, placeholder: "Все оценщики", options: uniqueEvaluators },
              ].map(({ value, onChange, placeholder, options }, idx) => (
                <div key={idx} className="px-4 py-3" style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}>
                  <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent text-[15px] outline-none"
                    style={{ color: value ? "#000" : "rgba(60,60,67,0.5)" }}
                  >
                    <option value="">{placeholder}</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: tab === key ? "#007AFF" : "rgba(118,118,128,0.12)",
                    color: tab === key ? "#fff" : "rgba(60,60,67,0.6)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "employees" && (
              <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                {employeeStats.length === 0 ? (
                  <p className="text-center py-10 text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>Нет данных</p>
                ) : employeeStats.map((item, idx) => (
                  <motion.button
                    key={item.name} whileTap={{ scale: 0.98 }}
                    onClick={() => setLocation(`/dashboard/${encodeURIComponent(item.name)}`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5"
                    style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold flex-shrink-0"
                      style={{ background: `${scoreColor(item.avg)}15`, color: scoreColor(item.avg) }}>
                      {item.avg}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[15px] font-medium" style={{ color: "#000" }}>{item.name}</div>
                      <div className="text-[13px]" style={{ color: "rgba(60,60,67,0.5)" }}>{item.count} оценок</div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(60,60,67,0.3)" }} />
                  </motion.button>
                ))}
              </div>
            )}

            {tab === "questions" && (
              <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                {questionStats.length === 0 ? (
                  <p className="text-center py-10 text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>Нет данных</p>
                ) : questionStats.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 px-4 py-3.5"
                    style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: `${scoreColor(item.avg)}15`, color: scoreColor(item.avg) }}>
                      {item.avg}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] leading-snug" style={{ color: "#000" }}>{item.question}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "rgba(60,60,67,0.5)" }}>{item.count} ответов</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "checklists" && (
              <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                {checklistStats.length === 0 ? (
                  <p className="text-center py-10 text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>Нет данных</p>
                ) : checklistStats.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                      style={{ background: `${scoreColor(item.avg)}15`, color: scoreColor(item.avg) }}>
                      {item.avg}
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-medium" style={{ color: "#000" }}>{item.name}</div>
                      <div className="text-[13px]" style={{ color: "rgba(60,60,67,0.5)" }}>{item.count} оценок</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "history" && (
              <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                {filtered.length === 0 ? (
                  <p className="text-center py-10 text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>Нет данных</p>
                ) : filtered.map((item, idx) => (
                  <motion.button
                    key={item.id} whileTap={{ scale: 0.98 }}
                    onClick={() => setLocation(`/history/${item.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                    style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                      style={{ background: `${scoreColor(item.average_score)}15`, color: scoreColor(item.average_score) }}>
                      {Number(item.average_score).toFixed(1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium truncate" style={{ color: "#000" }}>{item.employee_name}</div>
                      <div className="text-[12px]" style={{ color: "rgba(60,60,67,0.5)" }}>
                        {new Date(item.created_at).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(60,60,67,0.3)" }} />
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
