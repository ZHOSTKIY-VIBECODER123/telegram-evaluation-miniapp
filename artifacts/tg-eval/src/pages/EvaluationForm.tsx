import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";
import { useEvaluation } from "@/context/EvaluationContext";

const SCORE_CFG: Record<number, { color: string; tint: string; active: string }> = {
  0: { color: "#FF3B30", tint: "rgba(255,59,48,0.1)",   active: "#FF3B30" },
  1: { color: "#FF9500", tint: "rgba(255,149,0,0.1)",   active: "#FF9500" },
  2: { color: "#C89000", tint: "rgba(255,214,10,0.15)", active: "#FFD60A" },
  3: { color: "#34C759", tint: "rgba(52,199,89,0.1)",   active: "#34C759" },
};

export default function EvaluationForm() {
  const [, setLocation] = useLocation();
  const {
    selectedChecklist,
    selectedEmployee,
    answers,
    setAnswer,
    sectionComments,
    setSectionComment,
  } = useEvaluation();

  useEffect(() => {
    if (!selectedChecklist || !selectedEmployee) setLocation("/");
  }, [selectedChecklist, selectedEmployee, setLocation]);

  if (!selectedChecklist || !selectedEmployee) return null;

  // Поддержка старых чеклистов без sections
  const sections =
    selectedChecklist.sections?.length > 0
      ? selectedChecklist.sections
      : [{ id: "default", title: "Вопросы", questions: selectedChecklist.questions }];

  // Глобальные индексы: сколько вопросов до каждой секции
  const offsets: number[] = [];
  let off = 0;
  for (const sec of sections) {
    offsets.push(off);
    off += sec.questions.length;
  }

  const total = selectedChecklist.questions.length;
  const answered = Object.values(answers).filter((a) => a.score !== null).length;
  const allAnswered = total > 0 && answered === total;
  const progress = total > 0 ? answered / total : 0;
  // Комментарий к каждому блоку обязателен
  const commentsFilled = sections.every((sec) => (sectionComments[sec.id] || "").trim().length > 0);
  const canFinish = allAnswered && commentsFilled;

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col" style={{ background: "hsl(240 5% 96%)" }}>

      {/* Sticky glass header */}
      <header
        className="sticky top-0 z-20 px-4 pt-12 pb-3"
        style={{
          background: "rgba(242,242,247,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setLocation("/employees")}
            className="flex items-center gap-0.5 text-[17px] active:opacity-60 transition-opacity"
            style={{ color: "#007AFF" }}
          >
            <ChevronLeft className="h-5 w-5" />
            Назад
          </button>
          <span className="text-[14px] font-semibold tabular-nums" style={{ color: "rgba(60,60,67,0.6)" }}>
            {answered} / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(60,60,67,0.12)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#007AFF" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        <p className="text-[12px] mt-1.5 truncate" style={{ color: "rgba(60,60,67,0.5)" }}>
          {selectedChecklist.name} · {selectedEmployee.name}
        </p>
      </header>

      {/* Scrollable sections */}
      <div className="flex-1 px-4 pt-4 pb-32 space-y-4">
        {sections.map((section, si) => {
          const secOffset = offsets[si];
          return (
            <div
              key={section.id}
              className="rounded-[20px] overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              {/* Block header */}
              <div
                className="px-4 py-3"
                style={{
                  background: "rgba(0,122,255,0.05)",
                  borderBottom: "0.5px solid rgba(60,60,67,0.12)",
                }}
              >
                <p className="text-[14px] font-semibold" style={{ color: "#007AFF" }}>
                  {section.title}
                </p>
              </div>

              {/* Questions in this block */}
              {section.questions.map((question, qi) => {
                const idx = secOffset + qi;
                const answer = answers[idx] || { score: null, comment: "" };
                return (
                  <div
                    key={idx}
                    className="px-4 pt-4 pb-3"
                    style={{ borderBottom: "0.5px solid rgba(60,60,67,0.1)" }}
                  >
                    <p className="text-[15px] font-medium leading-snug mb-3" style={{ color: "#000" }}>
                      {question}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {([0, 1, 2, 3] as const).map((score) => {
                        const cfg = SCORE_CFG[score];
                        const isActive = answer.score === score;
                        return (
                          <motion.button
                            key={score}
                            whileTap={{ scale: 0.91 }}
                            onClick={() => setAnswer(idx, { ...answer, score })}
                            className="h-11 rounded-[12px] text-[18px] font-bold flex items-center justify-center"
                            style={{
                              background: isActive ? cfg.active : cfg.tint,
                              color: isActive ? (score === 2 ? "#000" : "#fff") : cfg.color,
                              boxShadow: isActive ? `0 3px 10px ${cfg.active}55` : "none",
                            }}
                          >
                            {score}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Block comment (обязательный) */}
              <div className="px-4 pt-3 pb-4">
                <p
                  className="text-[11px] font-semibold mb-2"
                  style={{ color: "rgba(60,60,67,0.45)", letterSpacing: "0.4px" }}
                >
                  КОММЕНТАРИЙ ПО БЛОКУ <span style={{ color: "#FF3B30" }}>*</span>
                </p>
                <textarea
                  className="w-full px-3 py-2.5 rounded-[12px] text-[14px] resize-none outline-none"
                  style={{
                    background: "rgba(118,118,128,0.08)",
                    color: "#000",
                    minHeight: 68,
                  }}
                  placeholder="Комментарий по блоку..."
                  value={sectionComments[section.id] || ""}
                  onChange={(e) => setSectionComment(section.id, e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-8 pt-3"
        style={{
          background: "rgba(242,242,247,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <motion.button
          whileTap={canFinish ? { scale: 0.97 } : {}}
          disabled={!canFinish}
          onClick={() => setLocation("/results")}
          className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
          style={{
            background: canFinish ? "#007AFF" : "rgba(0,122,255,0.3)",
            color: "#fff",
            boxShadow: canFinish ? "0 4px 16px rgba(0,122,255,0.4)" : "none",
          }}
          data-testid="button-finish"
        >
          {!allAnswered ? (
            "Ответьте на все вопросы"
          ) : !commentsFilled ? (
            "Заполните комментарии к блокам"
          ) : (
            <>
              <Check className="h-5 w-5" />
              Завершить
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
