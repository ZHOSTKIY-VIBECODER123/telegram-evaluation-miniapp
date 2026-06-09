import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Checklist, Employee } from "@/data/mockData";

interface Answer {
  score: number | null;
  comment: string;
}

interface EvaluationContextType {
  selectedChecklist: Checklist | null;
  setSelectedChecklist: (checklist: Checklist | null) => void;
  selectedEmployee: Employee | null;
  setSelectedEmployee: (employee: Employee | null) => void;
  selectedEvaluator: Employee | null;
  setSelectedEvaluator: (employee: Employee | null) => void;
  /** answers[globalQuestionIndex] = { score, comment } */
  answers: Record<number, Answer>;
  setAnswer: (questionIndex: number, answer: Answer) => void;
  /** sectionComments[sectionId] = commentText */
  sectionComments: Record<string, string>;
  setSectionComment: (sectionId: string, comment: string) => void;
  reset: () => void;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEvaluator, setSelectedEvaluator] = useState<Employee | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [sectionComments, setSectionComments] = useState<Record<string, string>>({});

  const setAnswer = useCallback((questionIndex: number, answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  }, []);

  const setSectionComment = useCallback((sectionId: string, comment: string) => {
    setSectionComments((prev) => ({ ...prev, [sectionId]: comment }));
  }, []);

  const reset = useCallback(() => {
    setSelectedChecklist(null);
    setSelectedEmployee(null);
    setSelectedEvaluator(null);
    setAnswers({});
    setSectionComments({});
  }, []);

  return (
    <EvaluationContext.Provider
      value={{
        selectedChecklist,
        setSelectedChecklist,
        selectedEmployee,
        setSelectedEmployee,
        selectedEvaluator,
        setSelectedEvaluator,
        answers,
        setAnswer,
        sectionComments,
        setSectionComment,
        reset,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error("useEvaluation must be used within an EvaluationProvider");
  }
  return context;
}
