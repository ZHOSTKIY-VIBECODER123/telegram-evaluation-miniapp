import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useEvaluation } from "@/context/EvaluationContext";
import { Textarea } from "@/components/ui/textarea";
import { ScoreButton } from "@/components/ScoreButton";

export default function EvaluationForm() {
  const [, setLocation] = useLocation();
  const { selectedChecklist, selectedEmployee, currentQuestionIndex, setCurrentQuestionIndex, answers, setAnswer } = useEvaluation();
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!selectedChecklist || !selectedEmployee) setLocation("/");
  }, [selectedChecklist, selectedEmployee, setLocation]);

  if (!selectedChecklist || !selectedEmployee) return null;

  const totalQuestions = selectedChecklist.questions.length;
  const currentQuestion = selectedChecklist.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex] || { score: null, comment: "" };
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const progress = (currentQuestionIndex + 1) / totalQuestions;

  const handleNext = () => {
    if (isLastQuestion) setLocation("/results");
    else { setDirection(1); setCurrentQuestionIndex(currentQuestionIndex + 1); }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) { setDirection(-1); setCurrentQuestionIndex(currentQuestionIndex - 1); }
    else setLocation("/employees");
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col overflow-hidden" style={{ background: "hsl(240 5% 96%)" }}>

      {/* Header with glass blur */}
      <header
        className="sticky top-0 z-20 px-4 pt-12 pb-3"
        style={{ background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrev}
            className="flex items-center gap-0.5 text-[17px] active:opacity-60 transition-opacity"
            style={{ color: "#007AFF" }}
          >
            <ChevronLeft className="h-5 w-5" />
            Назад
          </button>
          <span className="text-[15px] font-medium" style={{ color: "rgba(60,60,67,0.6)" }}>
            {currentQuestionIndex + 1} / {totalQuestions}
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

        <div className="mt-2">
          <p className="text-[13px] font-medium truncate" style={{ color: "rgba(60,60,67,0.6)" }}>
            {selectedChecklist.name} · {selectedEmployee.name}
          </p>
        </div>
      </header>

      {/* Question */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestionIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
            className="absolute inset-0 px-4 pt-6 pb-28 flex flex-col gap-6 overflow-y-auto"
          >
            {/* Question card */}
            <div
              className="rounded-[20px] p-5"
              style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <p className="text-[19px] font-semibold leading-snug" style={{ color: "#000", letterSpacing: "-0.2px" }}>
                {currentQuestion}
              </p>
            </div>

            {/* Score buttons */}
            <div>
              <p className="text-[13px] font-medium mb-3 px-1" style={{ color: "rgba(60,60,67,0.6)" }}>ОЦЕНКА</p>
              <div className="grid grid-cols-4 gap-2.5">
                {[0, 1, 2, 3].map((score) => (
                  <ScoreButton
                    key={score}
                    score={score}
                    selected={currentAnswer.score === score}
                    onClick={() => setAnswer(currentQuestionIndex, { ...currentAnswer, score })}
                    data-testid={`button-score-${score}`}
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <p className="text-[13px] font-medium mb-2 px-1" style={{ color: "rgba(60,60,67,0.6)" }}>КОММЕНТАРИЙ</p>
              <Textarea
                placeholder="Необязательно..."
                className="min-h-[100px] resize-none rounded-[16px] border-0 text-[15px]"
                style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                value={currentAnswer.comment}
                onChange={(e) => setAnswer(currentQuestionIndex, { ...currentAnswer, comment: e.target.value })}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-8 pt-3"
        style={{ background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={currentAnswer.score === null}
          onClick={handleNext}
          className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: currentAnswer.score !== null ? "#007AFF" : "rgba(0,122,255,0.3)",
            color: "#fff",
            boxShadow: currentAnswer.score !== null ? "0 4px 16px rgba(0,122,255,0.4)" : "none",
          }}
          data-testid={isLastQuestion ? "button-finish" : "button-next"}
        >
          {isLastQuestion ? (
            <><Check className="h-5 w-5" /> Завершить</>
          ) : (
            <>Далее <ChevronRight className="h-5 w-5" /></>
          )}
        </motion.button>
      </div>
    </div>
  );
}
