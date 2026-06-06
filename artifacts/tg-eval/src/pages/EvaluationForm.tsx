import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useEvaluation } from "@/context/EvaluationContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScoreButton } from "@/components/ScoreButton";
import { ProgressBar } from "@/components/ProgressBar";

export default function EvaluationForm() {
  const [, setLocation] = useLocation();
  const {
    selectedChecklist,
    selectedEmployee,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswer,
  } = useEvaluation();

  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!selectedChecklist || !selectedEmployee) {
      setLocation("/");
    }
  }, [selectedChecklist, selectedEmployee, setLocation]);

  if (!selectedChecklist || !selectedEmployee) return null;

  const totalQuestions = selectedChecklist.questions.length;
  const currentQuestion = selectedChecklist.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex] || {
    score: null,
    comment: "",
  };

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      setLocation("/results");
    } else {
      setDirection(1);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setLocation("/employees");
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] bg-background flex flex-col overflow-hidden relative">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-2 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">
              {selectedChecklist.name}
            </h1>
            <p className="text-sm opacity-90 truncate">
              {selectedEmployee.name} • {selectedEmployee.role}
            </p>
          </div>
        </div>
        <div className="bg-primary-foreground/20 rounded-full p-1 pb-3">
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={totalQuestions}
          />
        </div>
      </header>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestionIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
            className="absolute inset-0 p-4 flex flex-col gap-6 overflow-y-auto pb-24"
          >
            <div className="space-y-4">
              <h2 className="text-xl font-medium leading-snug">
                {currentQuestion}
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((score) => (
                <ScoreButton
                  key={score}
                  score={score}
                  selected={currentAnswer.score === score}
                  onClick={() =>
                    setAnswer(currentQuestionIndex, { ...currentAnswer, score })
                  }
                  data-testid={`button-score-${score}`}
                />
              ))}
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium text-muted-foreground">
                Comments (optional)
              </label>
              <Textarea
                placeholder="Add a comment..."
                className="min-h-[120px] resize-none bg-muted/30 focus-visible:ring-primary/50"
                value={currentAnswer.comment}
                onChange={(e) =>
                  setAnswer(currentQuestionIndex, {
                    ...currentAnswer,
                    comment: e.target.value,
                  })
                }
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-4 bg-background/80 backdrop-blur-md border-t z-20">
        <Button
          className="w-full h-12 text-lg font-semibold rounded-xl"
          disabled={currentAnswer.score === null}
          onClick={handleNext}
          data-testid={isLastQuestion ? "button-finish" : "button-next"}
        >
          {isLastQuestion ? (
            <>
              Finish Evaluation <Check className="ml-2 h-5 w-5" />
            </>
          ) : (
            <>
              Next Question <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
