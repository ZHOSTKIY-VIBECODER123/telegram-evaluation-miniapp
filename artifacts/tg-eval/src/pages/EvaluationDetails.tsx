import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import { ChevronLeft } from "lucide-react";

const SCORE_CONFIG: Record<number, { bg: string; color: string }> = {
  0: { bg: "rgba(255,59,48,0.1)",   color: "#FF3B30" },
  1: { bg: "rgba(255,149,0,0.1)",   color: "#FF9500" },
  2: { bg: "rgba(255,214,10,0.15)", color: "#C89000" },
  3: { bg: "rgba(52,199,89,0.1)",   color: "#34C759" },
};
const SCORE_FALLBACK = { bg: "rgba(60,60,67,0.08)", color: "rgba(60,60,67,0.5)" };

const scoreColor = (v: number) => v >= 2.5 ? "#34C759" : v >= 1.5 ? "#FF9500" : "#FF3B30";

// ─── Detect format ───────────────────────────────────────────────────────────
// New: answers[0].sectionTitle exists → array of { sectionTitle, sectionComment, items[] }
// Old: array of { question, score, comment }

interface OldAnswer   { question: string; score: number | null; comment?: string }
interface NewItem     { question: string; score: number | null }
interface NewSection  { sectionTitle: string; sectionComment: string; items: NewItem[] }

function isNewFormat(answers: any[]): answers is NewSection[] {
  return answers.length > 0 && typeof answers[0].sectionTitle === "string";
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EvaluationDetails() {
  const [, params] = useRoute("/history/:id");
  const [, setLocation] = useLocation();
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!params?.id) return;
      const { data, error } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error || !data) {
        setLocation("/history");
        return;
      }
      setEvaluation(data);
    }
    load();
  }, [params, setLocation]);

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
      </div>
    );
  }

  const rawAnswers: any[] = Array.isArray(evaluation.answers)
    ? evaluation.answers
    : Object.values(evaluation.answers || {});

  const avg = Number(evaluation.average_score);
  const newFormat = isNewFormat(rawAnswers);
  const totalQuestions = newFormat
    ? rawAnswers.reduce((s: number, sec: NewSection) => s + sec.items.length, 0)
    : rawAnswers.length;

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

        {/* Answers label */}
        <p className="text-[13px] font-semibold px-1" style={{ color: "rgba(60,60,67,0.6)" }}>
          ОТВЕТЫ · {totalQuestions}
        </p>

        {/* ── NEW FORMAT: sectioned ── */}
        {newFormat && (rawAnswers as NewSection[]).map((section, si) => (
          <div
            key={si}
            className="rounded-[20px] overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            {/* Section header */}
            <div
              className="px-4 py-2.5"
              style={{ background: "rgba(0,122,255,0.05)", borderBottom: "0.5px solid rgba(60,60,67,0.12)" }}
            >
              <p className="text-[13px] font-semibold" style={{ color: "#007AFF" }}>
                {section.sectionTitle}
              </p>
            </div>

            {/* Items */}
            {section.items.map((item: NewItem, qi: number) => {
              const cfg = item.score !== null && item.score !== undefined
                ? (SCORE_CONFIG[item.score] ?? SCORE_FALLBACK)
                : SCORE_FALLBACK;
              return (
                <div
                  key={qi}
                  className="flex items-start gap-3 px-4 py-3.5"
                  style={{ borderBottom: "0.5px solid rgba(60,60,67,0.08)" }}
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {item.score ?? "—"}
                  </div>
                  <p className="flex-1 text-[15px] leading-snug pt-1" style={{ color: "#000" }}>
                    {item.question}
                  </p>
                </div>
              );
            })}

            {/* Section comment */}
            {section.sectionComment && (
              <div className="px-4 py-3" style={{ borderTop: "0.5px solid rgba(60,60,67,0.08)" }}>
                <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(60,60,67,0.45)", letterSpacing: "0.3px" }}>
                  КОММЕНТАРИЙ К БЛОКУ
                </p>
                <p className="text-[14px] italic" style={{ color: "rgba(60,60,67,0.7)" }}>
                  «{section.sectionComment}»
                </p>
              </div>
            )}
          </div>
        ))}

        {/* ── OLD FORMAT: flat list ── */}
        {!newFormat && (
          <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {(rawAnswers as OldAnswer[]).map((answer, idx) => {
              const cfg = answer.score !== null && answer.score !== undefined
                ? (SCORE_CONFIG[answer.score] ?? SCORE_FALLBACK)
                : SCORE_FALLBACK;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3.5"
                  style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {answer.score ?? "—"}
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
        )}
      </div>
    </div>
  );
}
