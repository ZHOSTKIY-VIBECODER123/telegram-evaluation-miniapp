import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import { ChevronLeft } from "lucide-react";

const SCORE_CONFIG: Record<number, { bg: string; color: string; label: string }> = {
  0: { bg: "rgba(255,59,48,0.1)", color: "#FF3B30", label: "Нет" },
  1: { bg: "rgba(255,149,0,0.1)", color: "#FF9500", label: "Частично" },
  2: { bg: "rgba(255,214,10,0.15)", color: "#C89000", label: "Хорошо" },
  3: { bg: "rgba(52,199,89,0.1)", color: "#34C759", label: "Отлично" },
};

const scoreColor = (v: number) => v >= 2.5 ? "#34C759" : v >= 1.5 ? "#FF9500" : "#FF3B30";

export default function EvaluationDetails() {
  const [, params] = useRoute("/history/:id");
  const [, setLocation] = useLocation();
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const { data } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .eq("id", params.id)
        .single();
      if (data) setEvaluation(data);
    }
    load();
  }, [params]);

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
      </div>
    );
  }

  const answers: any[] = Array.isArray(evaluation.answers)
    ? evaluation.answers
    : Object.values(evaluation.answers || {});

  const avg = Number(evaluation.average_score);

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] pb-8">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => setLocation("/history")}
          className="flex items-center gap-0.5 text-[17px] mb-3 active:opacity-60 transition-opacity"
          style={{ color: "#007AFF" }}
        >
          <ChevronLeft className="h-5 w-5" />
          История
        </button>
        <h1 className="text-[28px] font-bold" style={{ color: "#000", letterSpacing: "-0.3px" }}>
          {evaluation.employee_name}
        </h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] p-5"
          style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[13px] font-medium" style={{ color: "rgba(60,60,67,0.6)" }}>СРЕДНИЙ БАЛЛ</div>
              <div className="text-[40px] font-bold mt-1" style={{ color: scoreColor(avg), letterSpacing: "-1px" }}>
                {avg.toFixed(1)}
              </div>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-[28px] font-bold"
              style={{ background: `${scoreColor(avg)}15` }}
            >
              {avg >= 2.5 ? "✦" : avg >= 1.5 ? "◈" : "◇"}
            </div>
          </div>
          <div className="space-y-2 text-[15px]" style={{ borderTop: "0.5px solid rgba(60,60,67,0.12)", paddingTop: 12 }}>
            {[
              ["Оценщик", evaluation.evaluator_name || "—"],
              ["Чек-лист", evaluation.checklist_name],
              ["Дата", new Date(evaluation.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span style={{ color: "rgba(60,60,67,0.6)" }}>{label}</span>
                <span className="font-medium text-right" style={{ color: "#000" }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Answers */}
        <p className="text-[13px] font-semibold px-1" style={{ color: "rgba(60,60,67,0.6)" }}>
          ОТВЕТЫ · {answers.length}
        </p>

        <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {answers.map((answer: any, idx: number) => {
            const cfg = answer.score !== null && answer.score !== undefined
              ? SCORE_CONFIG[answer.score] ?? { bg: "rgba(60,60,67,0.08)", color: "rgba(60,60,67,0.5)", label: "—" }
              : { bg: "rgba(60,60,67,0.08)", color: "rgba(60,60,67,0.5)", label: "—" };

            return (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-3.5"
                style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex flex-col items-center justify-center"
                  style={{ background: cfg.bg }}
                >
                  <span className="text-[15px] font-bold leading-none" style={{ color: cfg.color }}>
                    {answer.score ?? "—"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium leading-snug" style={{ color: "#000" }}>
                    {answer.question || `Вопрос #${idx + 1}`}
                  </p>
                  {answer.comment && (
                    <p className="mt-1.5 text-[13px] italic" style={{ color: "rgba(60,60,67,0.6)" }}>
                      «{answer.comment}»
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
