import { useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, X, Check } from "lucide-react";

type Employee = {
  id: number;
  full_name: string;
  role: string;
  can_evaluate: boolean;
  active: boolean;
};

type Question = { id: number; question_text: string; sort_order: number };
type Section = { id: number; title: string; sort_order: number; checklist_questions: Question[] };
type Checklist = { id: number; name: string; checklist_sections: Section[] };

const TABS = [
  { key: "employees", label: "Сотрудники" },
  { key: "checklists", label: "Чек-листы" },
  { key: "roles", label: "Роли" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function Settings() {
  const [tab, setTab] = useState<TabKey>("employees");
  const { toast } = useToast();

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh]">
      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-[34px] font-bold" style={{ color: "#000", letterSpacing: "-0.5px" }}>
          Настройки
        </h1>
      </header>

      <div className="px-4 space-y-4 pb-32">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors"
              style={{
                background: tab === key ? "#007AFF" : "rgba(118,118,128,0.12)",
                color: tab === key ? "#fff" : "rgba(60,60,67,0.6)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "employees" && <EmployeesTab toast={toast} />}
        {tab === "checklists" && <ChecklistsTab toast={toast} />}
        {tab === "roles" && <RolesTab />}
      </div>
    </div>
  );
}

/* ─── EMPLOYEES TAB ──────────────────────────────── */
function EmployeesTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", role: "", can_evaluate: false });

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabase().from("employees").select("*").order("full_name");
    setEmployees(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveNew = async () => {
    if (!form.full_name.trim() || !form.role.trim()) return;
    const { error } = await getSupabase().from("employees").insert({
      full_name: form.full_name.trim(),
      role: form.role.trim(),
      can_evaluate: form.can_evaluate,
      active: true,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Сотрудник добавлен ✓" });
    setShowAdd(false);
    setForm({ full_name: "", role: "", can_evaluate: false });
    load();
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (!editTarget.full_name.trim() || !editTarget.role.trim()) {
      toast({ title: "Заполните имя и роль", variant: "destructive" });
      return;
    }
    const { error } = await getSupabase().from("employees").update({
      full_name: editTarget.full_name.trim(),
      role: editTarget.role.trim(),
      can_evaluate: editTarget.can_evaluate,
    }).eq("id", editTarget.id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Сохранено ✓" });
    setEditTarget(null);
    load();
  };

  const toggleActive = async (emp: Employee) => {
    const { error } = await getSupabase().from("employees").update({ active: !emp.active }).eq("id", emp.id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const activeEmps = employees.filter((e) => e.active);
  const inactiveEmps = employees.filter((e) => !e.active);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowAdd(true)}
        className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
        style={{ background: "#007AFF", color: "#fff", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}
      >
        <Plus className="h-5 w-5" /> Добавить сотрудника
      </motion.button>

      {/* Active employees */}
      {activeEmps.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold px-1 mb-2" style={{ color: "rgba(60,60,67,0.6)" }}>
            АКТИВНЫЕ · {activeEmps.length}
          </p>
          <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {activeEmps.map((emp, idx) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold flex-shrink-0"
                  style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}
                >
                  {emp.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium truncate" style={{ color: "#000" }}>{emp.full_name}</div>
                  <div className="text-[13px] flex items-center gap-2" style={{ color: "rgba(60,60,67,0.5)" }}>
                    {emp.role}
                    {emp.can_evaluate && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
                        Оценщик
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditTarget({ ...emp })}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                    style={{ background: "rgba(60,60,67,0.08)" }}
                  >
                    <Pencil className="h-3.5 w-3.5" style={{ color: "rgba(60,60,67,0.5)" }} />
                  </button>
                  <button
                    onClick={() => toggleActive(emp)}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                    style={{ background: "rgba(255,59,48,0.1)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" style={{ color: "#FF3B30" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive employees */}
      {inactiveEmps.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold px-1 mb-2" style={{ color: "rgba(60,60,67,0.6)" }}>
            АРХИВ · {inactiveEmps.length}
          </p>
          <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {inactiveEmps.map((emp, idx) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 px-4 py-3.5 opacity-50"
                style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold flex-shrink-0"
                  style={{ background: "rgba(60,60,67,0.1)", color: "rgba(60,60,67,0.5)" }}
                >
                  {emp.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium truncate" style={{ color: "#000" }}>{emp.full_name}</div>
                  <div className="text-[13px]" style={{ color: "rgba(60,60,67,0.5)" }}>{emp.role}</div>
                </div>
                <button
                  onClick={() => toggleActive(emp)}
                  className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                  style={{ background: "rgba(52,199,89,0.1)" }}
                >
                  <Plus className="h-3.5 w-3.5" style={{ color: "#34C759" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add sheet */}
      <AnimatePresence>
        {showAdd && (
          <IosSheet title="Новый сотрудник" onClose={() => setShowAdd(false)}>
            <div className="space-y-0 rounded-[16px] overflow-hidden" style={{ background: "rgba(118,118,128,0.08)" }}>
              <input
                className="w-full px-4 py-3.5 text-[16px] bg-transparent outline-none"
                style={{ borderBottom: "0.5px solid rgba(60,60,67,0.12)" }}
                placeholder="Имя"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
              <input
                className="w-full px-4 py-3.5 text-[16px] bg-transparent outline-none"
                placeholder="Роль"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            </div>
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-[16px] mt-3"
              style={{ background: "rgba(118,118,128,0.08)" }}
            >
              <span className="text-[16px]" style={{ color: "#000" }}>Может проводить оценку</span>
              <IosToggle checked={form.can_evaluate} onChange={(v) => setForm((f) => ({ ...f, can_evaluate: v }))} />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={saveNew}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold mt-4"
              style={{ background: "#007AFF", color: "#fff" }}
            >
              Добавить
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Edit sheet */}
      <AnimatePresence>
        {editTarget && (
          <IosSheet title="Редактировать" onClose={() => setEditTarget(null)}>
            <div className="space-y-0 rounded-[16px] overflow-hidden" style={{ background: "rgba(118,118,128,0.08)" }}>
              <input
                className="w-full px-4 py-3.5 text-[16px] bg-transparent outline-none"
                style={{ borderBottom: "0.5px solid rgba(60,60,67,0.12)" }}
                placeholder="Имя"
                value={editTarget.full_name}
                onChange={(e) => setEditTarget((t) => t && ({ ...t, full_name: e.target.value }))}
              />
              <input
                className="w-full px-4 py-3.5 text-[16px] bg-transparent outline-none"
                placeholder="Роль"
                value={editTarget.role}
                onChange={(e) => setEditTarget((t) => t && ({ ...t, role: e.target.value }))}
              />
            </div>
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-[16px] mt-3"
              style={{ background: "rgba(118,118,128,0.08)" }}
            >
              <span className="text-[16px]" style={{ color: "#000" }}>Может проводить оценку</span>
              <IosToggle
                checked={editTarget.can_evaluate}
                onChange={(v) => setEditTarget((t) => t && ({ ...t, can_evaluate: v }))}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={saveEdit}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold mt-4 flex items-center justify-center gap-2"
              style={{ background: "#007AFF", color: "#fff" }}
            >
              <Check className="h-5 w-5" /> Сохранить
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── CHECKLISTS TAB ─────────────────────────────── */
function ChecklistsTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  // Вопрос добавляется через IosSheet, а не inline (клавиатура на мобиле обрезала overflow:hidden)
  const [addQuestionSheet, setAddQuestionSheet] = useState<{ sectionId: number; sectionTitle: string } | null>(null);
  const [newQuestion, setNewQuestion] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await getSupabase()
      .from("checklists")
      .select("*, checklist_sections(*, checklist_questions(*))")
      .order("id");
    setChecklists((data as Checklist[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addChecklist = async () => {
    if (!newName.trim()) return;
    const { data: cl, error } = await getSupabase().from("checklists").insert({ name: newName.trim() }).select().single();
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    const { error: secError } = await getSupabase().from("checklist_sections").insert({ checklist_id: cl.id, title: "Раздел 1", sort_order: 0 });
    if (secError) {
      await getSupabase().from("checklists").delete().eq("id", cl.id);
      toast({ title: "Ошибка", description: "Не удалось создать раздел", variant: "destructive" });
      return;
    }
    setNewName("");
    setShowAddChecklist(false);
    toast({ title: "Чек-лист создан ✓" });
    load();
  };

  const addQuestion = async () => {
    if (!addQuestionSheet || !newQuestion.trim()) return;
    const section = checklists.flatMap((c) => c.checklist_sections).find((s) => s.id === addQuestionSheet.sectionId);
    const maxOrder = section ? Math.max(0, ...section.checklist_questions.map((q) => q.sort_order)) : 0;
    const { error } = await getSupabase().from("checklist_questions").insert({
      section_id: addQuestionSheet.sectionId,
      question_text: newQuestion.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setNewQuestion("");
    setAddQuestionSheet(null);
    toast({ title: "Вопрос добавлен ✓" });
    load();
  };

  const deleteQuestion = async (questionId: number) => {
    const { error } = await getSupabase().from("checklist_questions").delete().eq("id", questionId);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowAddChecklist(true)}
        className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
        style={{ background: "#007AFF", color: "#fff", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}
      >
        <Plus className="h-5 w-5" /> Новый чек-лист
      </motion.button>

      {checklists.map((cl) => (
        <div key={cl.id} className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <button
            className="w-full flex items-center gap-3 px-4 py-4"
            onClick={() => setExpanded(expanded === cl.id ? null : cl.id)}
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg">
              📋
            </div>
            <div className="flex-1 text-left">
              <div className="text-[15px] font-semibold" style={{ color: "#000" }}>{cl.name}</div>
              <div className="text-[13px]" style={{ color: "rgba(60,60,67,0.5)" }}>
                {cl.checklist_sections.reduce((sum, s) => sum + s.checklist_questions.length, 0)} вопросов
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded === cl.id ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" style={{ color: "rgba(60,60,67,0.3)" }} />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded === cl.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: "hidden", borderTop: "0.5px solid rgba(60,60,67,0.12)" }}
              >
                {cl.checklist_sections.sort((a, b) => a.sort_order - b.sort_order).map((sec) => (
                  <div key={sec.id} className="px-4 py-3">
                    <p className="text-[12px] font-semibold mb-2" style={{ color: "rgba(60,60,67,0.45)", letterSpacing: "0.5px" }}>
                      {sec.title.toUpperCase()}
                    </p>
                    <div className="space-y-0">
                      {sec.checklist_questions.sort((a, b) => a.sort_order - b.sort_order).map((q, qi) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-2 py-2.5"
                          style={{ borderTop: qi > 0 ? "0.5px solid rgba(60,60,67,0.08)" : "none" }}
                        >
                          <ChevronRight className="h-3 w-3 flex-shrink-0 mt-1" style={{ color: "rgba(60,60,67,0.25)" }} />
                          <span className="flex-1 text-[14px] leading-snug" style={{ color: "#000" }}>{q.question_text}</span>
                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 active:opacity-60 mt-0.5"
                            style={{ background: "rgba(255,59,48,0.1)" }}
                          >
                            <X className="h-3 w-3" style={{ color: "#FF3B30" }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Кнопка открывает IosSheet вместо inline-input */}
                    <button
                      onClick={() => { setAddQuestionSheet({ sectionId: sec.id, sectionTitle: sec.title }); setNewQuestion(""); }}
                      className="mt-3 flex items-center gap-1.5 text-[14px] active:opacity-60"
                      style={{ color: "#007AFF" }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Добавить вопрос
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Sheet: добавить вопрос */}
      <AnimatePresence>
        {addQuestionSheet && (
          <IosSheet
            title={`Вопрос · ${addQuestionSheet.sectionTitle}`}
            onClose={() => setAddQuestionSheet(null)}
          >
            <textarea
              className="w-full px-4 py-3.5 text-[16px] rounded-[16px] outline-none resize-none"
              style={{ background: "rgba(118,118,128,0.08)", color: "#000", minHeight: 100 }}
              placeholder="Текст вопроса..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={addQuestion}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold mt-3 flex items-center justify-center gap-2"
              style={{
                background: newQuestion.trim() ? "#007AFF" : "rgba(0,122,255,0.3)",
                color: "#fff",
              }}
            >
              <Check className="h-5 w-5" /> Добавить
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Sheet: новый чек-лист */}
      <AnimatePresence>
        {showAddChecklist && (
          <IosSheet title="Новый чек-лист" onClose={() => setShowAddChecklist(false)}>
            <input
              className="w-full px-4 py-3.5 text-[16px] rounded-[16px] outline-none"
              style={{ background: "rgba(118,118,128,0.08)" }}
              placeholder="Название чек-листа"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={addChecklist}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold mt-4 flex items-center justify-center gap-2"
              style={{ background: "#007AFF", color: "#fff" }}
            >
              <Plus className="h-5 w-5" /> Создать
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── ROLES TAB ──────────────────────────────────── */
function RolesTab() {
  const matrix = [
    { from: "Team Leader", to: "Менеджер по привлечению партнеров" },
    { from: "Руководитель отдела", to: "Team Leader" },
    { from: "Бизнес Поддержка", to: "Руководитель отдела" },
  ];

  const info = [
    { label: "Версия", value: "1.1.0" },
    { label: "База данных", value: "Supabase" },
    { label: "Платформа", value: "Telegram Mini App" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-semibold px-1 mb-2" style={{ color: "rgba(60,60,67,0.6)" }}>
          КТО ОЦЕНИВАЕТ КОГО
        </p>
        <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {matrix.map(({ from, to }, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-4 py-3.5"
              style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
            >
              <span className="text-[14px] font-medium flex-1" style={{ color: "#000" }}>{from}</span>
              <span className="text-[13px] px-2" style={{ color: "rgba(60,60,67,0.4)" }}>→</span>
              <span className="text-[14px] flex-1 text-right" style={{ color: "rgba(60,60,67,0.7)" }}>{to}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] px-1 mt-2" style={{ color: "rgba(60,60,67,0.45)" }}>
          Изменение схемы требует правки кода разработчиком.
        </p>
      </div>

      <div>
        <p className="text-[13px] font-semibold px-1 mb-2" style={{ color: "rgba(60,60,67,0.6)" }}>
          О ПРИЛОЖЕНИИ
        </p>
        <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {info.map(({ label, value }, idx) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
            >
              <span className="text-[15px]" style={{ color: "#000" }}>{label}</span>
              <span className="text-[15px]" style={{ color: "rgba(60,60,67,0.5)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SHARED COMPONENTS ──────────────────────────── */
function IosSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      {/* Backdrop — выше навигации (z-50) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[59]"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />
      {/* Sheet — выше backdrop и навигации */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[60] max-w-[430px] mx-auto rounded-t-[24px] px-4 pt-5 pb-12"
        style={{ background: "#F2F2F7" }}
      >
        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(60,60,67,0.2)" }} />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-bold" style={{ color: "#000", letterSpacing: "-0.3px" }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(60,60,67,0.12)" }}
          >
            <X className="h-4 w-4" style={{ color: "rgba(60,60,67,0.6)" }} />
          </button>
        </div>
        {children}
      </motion.div>
    </>
  );
}

function IosToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-[51px] h-[31px] rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: checked ? "#34C759" : "rgba(120,120,128,0.16)" }}
    >
      <motion.div
        className="absolute top-[2px] w-[27px] h-[27px] rounded-full"
        style={{ background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}
        animate={{ left: checked ? "22px" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
