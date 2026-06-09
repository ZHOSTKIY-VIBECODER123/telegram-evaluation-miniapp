import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEvaluation } from "@/context/EvaluationContext";
import { useEmployees } from "@/hooks/useEmployees";

export default function EmployeeSelection() {
  const [, setLocation] = useLocation();
  const { selectedChecklist, setSelectedEmployee, selectedEvaluator, setSelectedEvaluator } = useEvaluation();
  const [searchQuery, setSearchQuery] = useState("");
  const { employees, loading } = useEmployees();

  const evaluators = employees.filter((e) => e.canEvaluate);

  if (!selectedChecklist) { setLocation("/"); return null; }

  const handleSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setLocation("/evaluate");
  };

  // Показываем всех активных сотрудников, кроме самого оценщика
  const filteredEmployees = employees
    .filter((emp) => {
      if (!selectedEvaluator) return false;
      // Не показываем оценщика в списке оцениваемых
      if (emp.id === selectedEvaluator.id) return false;
      return true;
    })
    .filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "tween", ease: "anticipate", duration: 0.25 }}
      className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 pt-12 pb-3" style={{ background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-0.5 text-[17px] font-normal active:opacity-60 transition-opacity"
            style={{ color: "#007AFF" }}
          >
            <ChevronLeft className="h-5 w-5" />
            Назад
          </button>
        </div>
        <h1 className="text-[28px] font-bold mb-3" style={{ color: "#000", letterSpacing: "-0.3px" }}>
          Сотрудники
        </h1>

        {/* Evaluator picker */}
        <div
          className="rounded-[12px] overflow-hidden mb-3"
          style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-[13px] font-medium flex-shrink-0" style={{ color: "rgba(60,60,67,0.6)" }}>Оценщик</span>
            <select
              value={selectedEvaluator?.id || ""}
              onChange={(e) => {
                const ev = evaluators.find((x) => x.id === e.target.value);
                if (ev) setSelectedEvaluator(ev);
              }}
              className="flex-1 text-[15px] font-medium bg-transparent outline-none text-right appearance-none"
              style={{ color: "#007AFF", direction: "rtl" }}
            >
              <option value="" style={{ direction: "ltr", color: "#000" }}>Выберите...</option>
              {evaluators.map((e) => (
                <option key={e.id} value={e.id} style={{ direction: "ltr", color: "#000" }}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[12px]"
          style={{ background: "rgba(118,118,128,0.12)" }}
        >
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(60,60,67,0.5)" }} />
          <input
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ color: "#000" }}
          />
        </div>
      </header>

      <div className="flex-1 px-4 pt-3">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
          </div>
        )}

        {!loading && !selectedEvaluator && (
          <div className="flex justify-center py-16 text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>
            Сначала выберите оценщика
          </div>
        )}

        {!loading && selectedEvaluator && filteredEmployees.length === 0 && (
          <div className="flex justify-center py-16 text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>
            Сотрудники не найдены
          </div>
        )}

        {!loading && selectedEvaluator && filteredEmployees.length > 0 && (
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            {filteredEmployees.map((employee, idx) => (
              <motion.button
                key={employee.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(employee)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[17px] font-semibold"
                  style={{ background: "rgba(0,122,255,0.12)", color: "#007AFF" }}
                >
                  {employee.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-medium truncate" style={{ color: "#000" }}>{employee.name}</div>
                  <div className="text-[13px]" style={{ color: "rgba(60,60,67,0.6)" }}>{employee.role}</div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(60,60,67,0.3)" }} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
