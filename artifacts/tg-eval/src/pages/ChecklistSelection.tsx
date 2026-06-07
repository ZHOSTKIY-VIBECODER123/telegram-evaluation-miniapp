import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { useEvaluation } from "@/context/EvaluationContext";
import { Checklist } from "@/data/mockData";
import { useChecklists } from "@/hooks/useChecklists";

export default function ChecklistSelection() {
  const [, setLocation] = useLocation();
  const { setSelectedChecklist } = useEvaluation();
  const { checklists, loading, error } = useChecklists();

  const handleSelect = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setLocation("/employees");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col"
    >
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-[34px] font-bold" style={{ color: "#000", letterSpacing: "-0.5px" }}>
          Оценка
        </h1>
        <p className="text-[15px] mt-0.5" style={{ color: "rgba(60,60,67,0.6)" }}>
          Выберите чек-лист
        </p>
      </header>

      <div className="flex-1 px-4 space-y-6">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#007AFF" }} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl p-4 text-sm" style={{ background: "rgba(255,59,48,0.1)" }}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#FF3B30" }} />
            <p style={{ color: "#FF3B30" }}>{error}</p>
          </div>
        )}

        {!loading && !error && checklists.length === 0 && (
          <div className="flex justify-center py-20 text-sm" style={{ color: "rgba(60,60,67,0.5)" }}>
            Чек-листы не найдены
          </div>
        )}

        {!loading && !error && checklists.length > 0 && (
          <>
            <div
              className="rounded-[20px] overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              {checklists.map((checklist, idx) => (
                <motion.button
                  key={checklist.id}
                  whileTap={{ scale: 0.98, backgroundColor: "rgba(0,0,0,0.04)" }}
                  onClick={() => handleSelect(checklist)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
                >
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: "rgba(0,122,255,0.1)" }}
                  >
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-medium" style={{ color: "#000" }}>
                      {checklist.name}
                    </div>
                    <div className="text-[13px] mt-0.5" style={{ color: "rgba(60,60,67,0.6)" }}>
                      {checklist.questions.length} вопросов
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(60,60,67,0.3)" }} />
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
