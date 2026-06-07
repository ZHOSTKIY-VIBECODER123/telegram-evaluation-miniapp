import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEvaluation } from "@/context/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
import { Check, RotateCcw, Loader2 } from "lucide-react";

const SCORE_COLORS = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759"] as const;

export default function Results() {
  const [, setLocation] = useLocation();
  const { selectedChecklist, selectedEmployee, selectedEvaluator, answers, reset } = useEvaluation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!selectedChecklist || !selectedEmployee) setLocation("/");
  }, [selectedChecklist, selectedEmployee, setLocation]);

  if (!selectedChecklist || !selectedEmployee) return null;

  const totalQuestions = selectedChecklist.questions.length;
  const answeredQuestions = Object.values(answers).filter((a) => a.score !== null);
  const totalScore = answeredQuestions.reduce((sum, a) => sum + (a.score || 0), 0);
  const maxPossibleScore = totalQuestions * 3;
  const averageScore = answeredQuestions.length > 0 ? (totalScore / answeredQuestions.length).toFixed(1) : "0.0";
  const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) : 0;

  const avg = Number(averageScore);
  const accentColor = avg >= 2.5 ? "#34C759" : avg >= 1.5 ? "#FF9500" : "#FF3B30";

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      const { error } = await getSupabase()
        .from("evaluation_results")
        .insert({
          checklist_name: selectedChecklist.name,
          employee_name: selectedEmployee.name,
          employee_role: selectedEmployee.role,
          evaluator_name: selectedEvaluator?.name || "",
          total_score: totalScore,
          average_score: Number(averageScore),
          answers: selectedChecklist.questions.map((question, index) => ({
            question,
            score: answers[index]?.score ?? null,
            comment: answers[index]?.comment ?? "",
          })),
        });

      if (error) throw error;

      // Google Sheets — fire-and-forget, ошибки не блокируют
      fetch(
        "https://script.google.com/macros/s/AKfycbzCEPf-2tm_p7rz6hkGvaFa93OQX26uVDvYKVexkvrFzFewLqM06jcu3iodme5VQff72g/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            created_at: new Date().toISOString(),
            evaluator_name: selectedEvaluator?.name || "",
            employee_name: selectedEmployee.name,
            checklist_name: selectedChecklist.name,
            total_score: totalScore,
            average_score: Number(averageScore),
            answers,
          }),
        }
      ).catch((e) => console.error("Sheets sync:", e));

      setSaved(true);
      toast({ title: "Сохранено ✓", description: "Оценка записана в базу данных." });
    } catch (err: unknown) {
      toast({ title: "Ошибка", description: err instanceof Error ? err.message : "Неизвестная ошибка", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
      className="max-w-[430px] mx-auto min-h-[100dvh] pb-8"
    >
      {/* Hero */}
      <div
        className="px-5 pt-16 pb-8 flex flex-col items-center text-center"
        style={{ background: `linear-gradient(180deg, ${accentColor}15 0%, transparent 100%)` }}
      >
        {/* Circular progress */}
        <div className="relative w-36 h-36 mb-5">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="7" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={accentColor} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - percentage) }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[36px] font-bold" style={{ color: accentColor, letterSpacing: "-1px" }}>
              {totalScore}
            </span>
            <span className="text-[13px]" style={{ color: "rgba(60,60,67,0.5)" }}>/ {maxPossibleScore}</span>
          </div>
        </div>

        <div
          className="px-5 py-2 rounded-full text-[17px] font-semibold"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          Средний: {averageScore}
        </div>

        <div className="mt-4">
          <div className="text-[20px] font-bold" style={{ color: "#000" }}>{selectedEmployee.name}</div>
          <div className="text-[15px] mt-0.5" style={{ color: "rgba(60,60,67,0.6)" }}>{selectedEmployee.role}</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="px-4 space-y-4">
        <p className="text-[13px] font-semibold px-1" style={{ color: "rgba(60,60,67,0.6)" }}>
          ОТВЕТЫ
        </p>
        <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {selectedChecklist.questions.map((question, idx) => {
            const answer = answers[idx];
            const score = answer?.score ?? null;
            const color = score !== null ? SCORE_COLORS[score] : "rgba(60,60,67,0.3)";
            return (
              <div
                key={idx}
                className="flex items-start gap-3 px-4 py-3.5"
                style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-bold"
                  style={{ background: score !== null ? `${color}18` : "rgba(60,60,67,0.08)", color }}
                >
                  {score ?? "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] leading-snug" style={{ color: "#000" }}>{question}</p>
                  {answer?.comment && (
                    <p className="mt-1 text-[13px] italic" style={{ color: "rgba(60,60,67,0.6)" }}>«{answer.comment}»</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <motion.button
          whileTap={!saving && !saved ? { scale: 0.97 } : {}}
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2 overflow-hidden relative"
          style={{
            background: saved ? "#34C759" : "#007AFF",
            color: "#fff",
            boxShadow: saved
              ? "0 4px 16px rgba(52,199,89,0.4)"
              : "0 4px 16px rgba(0,122,255,0.35)",
            opacity: saving ? 0.85 : 1,
            transition: "background 0.3s, box-shadow 0.3s",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {saving && (
              <motion.span
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-5 w-5 animate-spin" /> Сохранение...
              </motion.span>
            )}
            {!saving && saved && (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="h-5 w-5" /> Сохранено
              </motion.span>
            )}
            {!saving && !saved && (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2"
              >
                <Check className="h-5 w-5" /> Сохранить оценку
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { reset(); setLocation("/"); }}
          className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
          style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}
        >
          <RotateCcw className="h-4 w-4" /> Новая оценка
        </motion.button>
      </div>
    </motion.div>
  );
}
