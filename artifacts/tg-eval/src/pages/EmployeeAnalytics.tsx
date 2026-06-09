import { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const scoreColor = (v: number) => {
  if (v >= 2.5) return "#34C759";
  if (v >= 1.5) return "#FF9500";
  return "#FF3B30";
};

export default function EmployeeAnalytics() {
  const [, params] = useRoute("/dashboard/:employee");
  const [, setLocation] = useLocation();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!params?.employee) return;
      const employeeName = decodeURIComponent(params.employee);
      try {
        const { data, error: sbError } = await getSupabase()
          .from("evaluation_results")
          .select("*")
          .eq("employee_name", employeeName)
          .order("created_at", { ascending: true });
        if (sbError) { setLoadError(sbError.message); return; }
        setEvaluations(data || []);
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : "Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, { total: number; count: number }> = {};
    evaluations.forEach((r) => {
      const key = format(parseISO(r.created_at), "MMM yy", { locale: ru });
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
    return (sum / evaluations.length).toFixed(1);
  }, [evaluations]);

  if (!params?.employee) return null;
  const employeeName = decodeURIComponent(params.employee);

  const avgNum = overallAvg !== null ? Number(overallAvg) : 0;
  const accentColor = overallAvg !== null ? scoreColor(avgNum) : "#007AFF";

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] pb-8">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-0.5 text-[17px] mb-3 active:opacity-60 transition-opacity"
          style={{ color: "#007AFF" }}
        >
          <ChevronLeft className="h-5 w-5" />
          Аналитика
        </button>
        <h1 className="text-[28px] font-bold" style={{ color: "#000", letterSpacing: "-0.3px" }}>
          {employeeName}
        </h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {loadError && (
          <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}>
            {loadError}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            {overallAvg !== null && (
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[18px] p-4 text-center"
                  style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <div
                    className="text-[34px] font-bold"
                    style={{ color: accentColor, letterSpacing: "-1px" }}
                  >
                    {overallAvg}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "rgba(60,60,67,0.5)" }}>Средний балл</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-[18px] p-4 text-center"
                  style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <div className="text-[34px] font-bold" style={{ color: "#000", letterSpacing: "-1px" }}>
                    {evaluations.length}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "rgba(60,60,67,0.5)" }}>Оценок</div>
                </motion.div>
              </div>
            )}

            {/* Chart */}
            {chartData.length >= 2 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[20px] p-4"
                style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <p className="text-[13px] font-semibold mb-3" style={{ color: "rgba(60,60,67,0.6)" }}>
                  ДИНАМИКА
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "rgba(60,60,67,0.5)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 3]}
                      ticks={[0, 1, 2, 3]}
                      tick={{ fontSize: 11, fill: "rgba(60,60,67,0.5)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.95)",
                        border: "none",
                        borderRadius: 12,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        fontSize: 13,
                        color: "#000",
                      }}
                      formatter={(v: number) => [v.toFixed(2), "Средний балл"]}
                      labelStyle={{ color: "rgba(60,60,67,0.6)", fontSize: 12, marginBottom: 2 }}
                    />
                    <ReferenceLine
                      y={2.5}
                      stroke="#34C759"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      strokeOpacity={0.6}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#007AFF"
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={scoreColor(value)}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{ r: 7, fill: "#007AFF", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-[11px] mt-2 text-center" style={{ color: "rgba(60,60,67,0.4)" }}>
                  — пунктир: целевой порог 2.5
                </p>
              </motion.div>
            ) : chartData.length === 1 ? (
              <div
                className="rounded-[20px] p-4"
                style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <p className="text-[14px]" style={{ color: "rgba(60,60,67,0.5)" }}>
                  Для графика динамики нужны оценки в разные месяцы.
                </p>
              </div>
            ) : null}

            {/* History list */}
            {evaluations.length > 0 && (
              <div>
                <p className="text-[13px] font-semibold px-1 mb-2" style={{ color: "rgba(60,60,67,0.6)" }}>
                  ИСТОРИЯ ОЦЕНОК
                </p>
                <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  {[...evaluations].reverse().map((item, idx) => {
                    const avg = Number(item.average_score);
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLocation(`/history/${item.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                        style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                          style={{ background: `${scoreColor(avg)}18`, color: scoreColor(avg) }}
                        >
                          {avg.toFixed(1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium truncate" style={{ color: "#000" }}>
                            {item.checklist_name}
                          </div>
                          <div className="text-[12px] mt-0.5" style={{ color: "rgba(60,60,67,0.5)" }}>
                            {item.evaluator_name
                              ? `${item.evaluator_name} · `
                              : ""}
                            {new Date(item.created_at).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(60,60,67,0.3)" }} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {evaluations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="text-5xl">📊</div>
                <p className="text-[17px] font-semibold" style={{ color: "#000" }}>Нет оценок</p>
                <p className="text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>Оценки сотрудника появятся здесь</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
