import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import { ChevronRight } from "lucide-react";

const scoreColor = (v: number) => {
  if (v >= 2.5) return "#34C759";
  if (v >= 1.5) return "#FF9500";
  return "#FF3B30";
};

export default function History() {
  const [, setLocation] = useLocation();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .order("created_at", { ascending: false });
      setEvaluations(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh]">
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-[34px] font-bold" style={{ color: "#000", letterSpacing: "-0.5px" }}>
          История
        </h1>
        <p className="text-[15px] mt-0.5" style={{ color: "rgba(60,60,67,0.6)" }}>
          Все проведённые оценки
        </p>
      </header>

      <div className="px-4">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
          </div>
        )}

        {!loading && evaluations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl">📋</div>
            <p className="text-[17px] font-semibold" style={{ color: "#000" }}>Нет оценок</p>
            <p className="text-[15px] text-center" style={{ color: "rgba(60,60,67,0.6)" }}>Проведённые оценки появятся здесь</p>
          </div>
        )}

        {!loading && evaluations.length > 0 && (
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            {evaluations.map((item, idx) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation(`/history/${item.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-bold"
                  style={{ background: `${scoreColor(item.average_score)}18`, color: scoreColor(item.average_score) }}
                >
                  {Number(item.average_score).toFixed(1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium truncate" style={{ color: "#000" }}>
                    {item.employee_name}
                  </div>
                  <div className="text-[13px] truncate mt-0.5" style={{ color: "rgba(60,60,67,0.6)" }}>
                    {item.checklist_name}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "rgba(60,60,67,0.4)" }}>
                    {new Date(item.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(60,60,67,0.3)" }} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
