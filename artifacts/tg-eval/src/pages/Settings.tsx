import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { ROLES, ADMIN_ROLE } from "@/data/roles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ChevronDown,
  ArrowUp, ArrowDown, X, Check, LogOut,
} from "lucide-react";

type Employee = {
  id: number;
  full_name: string;
  role: string;
  can_evaluate: boolean;
  active: boolean;
};

type Question = { id: number; question_text: string; sort_order: number };
type Section = { id: number; title: string | null; sort_order: number; checklist_questions: Question[] };
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
  const { isAdmin } = useCurrentUser();

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh]">
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-[34px] font-bold" style={{ color: "#000", letterSpacing: "-0.5px" }}>
          Настройки
        </h1>
      </header>

      <div className="px-4 space-y-4 pb-32">
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

        {tab === "employees" && <EmployeesTab toast={toast} isAdmin={isAdmin} />}
        {tab === "checklists" && <ChecklistsTab toast={toast} isAdmin={isAdmin} />}
        {tab === "roles" && <RolesTab />}
      </div>
    </div>
  );
}

/* ─── EMPLOYEES TAB ──────────────────────────────── */
function EmployeesTab({ toast, isAdmin }: { toast: ReturnType<typeof useToast>["toast"]; isAdmin: boolean }) {
  const { currentUser, logout } = useCurrentUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [archiveDeleteTarget, setArchiveDeleteTarget] = useState<Employee | null>(null);
  const [confirmClearArchive, setConfirmClearArchive] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  // Новый сотрудник по умолчанию может оценивать — чтобы сразу появлялся в списке оценщиков
  const [form, setForm] = useState({ full_name: "", role: "", can_evaluate: true });

  const load = useCallback(async () => {
    const { data, error } = await getSupabase().from("employees").select("*").order("full_name");
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    if (!form.full_name.trim() || !form.role) {
      toast({ title: "Заполните имя и выберите роль", variant: "destructive" });
      return;
    }
    const { error } = await getSupabase().from("employees").insert({
      full_name: form.full_name.trim(),
      role: form.role,
      can_evaluate: form.can_evaluate,
      active: true,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Сотрудник добавлен ✓" });
    setShowAdd(false);
    setForm({ full_name: "", role: "", can_evaluate: true });
    load();
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const newName = editTarget.full_name.trim();
    if (!newName || !editTarget.role.trim()) {
      toast({ title: "Заполните имя и роль", variant: "destructive" });
      return;
    }
    const orig = employees.find((e) => e.id === editTarget.id);
    const { error } = await getSupabase().from("employees").update({
      full_name: newName,
      role: editTarget.role,
      can_evaluate: editTarget.can_evaluate,
    }).eq("id", editTarget.id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }

    // Каскад: при смене ФИО переименовываем сотрудника во всех старых оценках,
    // чтобы история и аналитика не «потеряли» его
    if (orig && orig.full_name !== newName) {
      const sb = getSupabase();
      const [r1, r2] = await Promise.all([
        sb.from("evaluation_results").update({ employee_name: newName }).eq("employee_name", orig.full_name),
        sb.from("evaluation_results").update({ evaluator_name: newName }).eq("evaluator_name", orig.full_name),
      ]);
      if (r1.error || r2.error) {
        toast({
          title: "Имя обновлено, но есть проблема",
          description: "Не все старые оценки удалось переименовать",
          variant: "destructive",
        });
      }
    }

    toast({ title: "Сохранено ✓" });
    setEditTarget(null);
    load();
  };

  const toggleActive = async (emp: Employee) => {
    const { error } = await getSupabase().from("employees").update({ active: !emp.active }).eq("id", emp.id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const deleteEmployee = async () => {
    if (!editTarget) return;
    const deletingSelf = String(editTarget.id) === currentUser?.id;
    const { error } = await getSupabase().from("employees").delete().eq("id", editTarget.id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Сотрудник удалён" });
    setEditTarget(null);
    setConfirmDelete(false);
    // Удалил сам себя → немедленно выходим, требуется повторная авторизация
    if (deletingSelf) { logout(); return; }
    load();
  };

  // Окончательное удаление из архива
  const deleteFromArchive = async () => {
    if (!archiveDeleteTarget) return;
    const { error } = await getSupabase().from("employees").delete().eq("id", archiveDeleteTarget.id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Удалён из архива" });
    setArchiveDeleteTarget(null);
    load();
  };

  // Полная очистка архива (все неактивные)
  const clearArchive = async () => {
    const { error } = await getSupabase().from("employees").delete().eq("active", false);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Архив очищен" });
    setConfirmClearArchive(false);
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
                    <span className="truncate">{emp.role}</span>
                    {emp.can_evaluate && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
                        Оценщик
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditTarget({ ...emp }); setConfirmDelete(false); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                    style={{ background: "rgba(60,60,67,0.08)" }}
                  >
                    <Pencil className="h-3.5 w-3.5" style={{ color: "rgba(60,60,67,0.5)" }} />
                  </button>
                  <button
                    onClick={() => toggleActive(emp)}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                    style={{ background: "rgba(255,149,0,0.12)" }}
                    title="В архив"
                  >
                    <X className="h-3.5 w-3.5" style={{ color: "#FF9500" }} />
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
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(emp)}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                    style={{ background: "rgba(52,199,89,0.1)" }}
                    title="Вернуть из архива"
                  >
                    <Plus className="h-3.5 w-3.5" style={{ color: "#34C759" }} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setArchiveDeleteTarget(emp)}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                      style={{ background: "rgba(255,59,48,0.1)" }}
                      title="Удалить навсегда"
                    >
                      <Trash2 className="h-3.5 w-3.5" style={{ color: "#FF3B30" }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isAdmin && inactiveEmps.length > 1 && (
            <button
              onClick={() => setConfirmClearArchive(true)}
              className="w-full mt-2 py-2.5 rounded-[12px] text-[14px] font-medium flex items-center justify-center gap-1.5 active:opacity-60"
              style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}
            >
              <Trash2 className="h-4 w-4" /> Очистить весь архив
            </button>
          )}
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
                placeholder="ФИО"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
              <RoleSelect
                value={form.role}
                onChange={(role) => setForm((f) => ({ ...f, role }))}
                excludeAdmin={!isAdmin}
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
                placeholder="ФИО"
                value={editTarget.full_name}
                onChange={(e) => setEditTarget((t) => t && ({ ...t, full_name: e.target.value }))}
              />
              <RoleSelect
                value={editTarget.role}
                onChange={(role) => setEditTarget((t) => t && ({ ...t, role }))}
                disabled={!isAdmin}
              />
            </div>
            {!isAdmin && (
              <p className="text-[12px] px-1 mt-1.5" style={{ color: "rgba(60,60,67,0.45)" }}>
                Роль может менять только «{ADMIN_ROLE}»
              </p>
            )}
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

            {/* Удаление — только администратор, с подтверждением */}
            {isAdmin && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => (confirmDelete ? deleteEmployee() : setConfirmDelete(true))}
                className="w-full h-[48px] rounded-[16px] text-[16px] font-semibold mt-3 flex items-center justify-center gap-2"
                style={{
                  background: confirmDelete ? "#FF3B30" : "rgba(255,59,48,0.1)",
                  color: confirmDelete ? "#fff" : "#FF3B30",
                }}
              >
                <Trash2 className="h-4 w-4" />
                {confirmDelete ? "Точно удалить навсегда?" : "Удалить сотрудника"}
              </motion.button>
            )}
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Подтверждение: удалить одного из архива */}
      <AnimatePresence>
        {archiveDeleteTarget && (
          <IosSheet title="Удалить навсегда?" onClose={() => setArchiveDeleteTarget(null)}>
            <p className="text-[15px] px-1 mb-4" style={{ color: "rgba(60,60,67,0.7)" }}>
              «{archiveDeleteTarget.full_name}» будет удалён безвозвратно. Старые оценки этого сотрудника останутся в истории.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={deleteFromArchive}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "#FF3B30", color: "#fff" }}
            >
              <Trash2 className="h-5 w-5" /> Удалить
            </motion.button>
            <button
              onClick={() => setArchiveDeleteTarget(null)}
              className="w-full h-[48px] rounded-[16px] text-[16px] font-semibold mt-3"
              style={{ background: "rgba(118,118,128,0.12)", color: "#007AFF" }}
            >
              Отмена
            </button>
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Подтверждение: очистить весь архив */}
      <AnimatePresence>
        {confirmClearArchive && (
          <IosSheet title="Очистить архив?" onClose={() => setConfirmClearArchive(false)}>
            <p className="text-[15px] px-1 mb-4" style={{ color: "rgba(60,60,67,0.7)" }}>
              Все {inactiveEmps.length} сотрудник(ов) из архива будут удалены безвозвратно. Старые оценки останутся в истории.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={clearArchive}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "#FF3B30", color: "#fff" }}
            >
              <Trash2 className="h-5 w-5" /> Очистить архив
            </motion.button>
            <button
              onClick={() => setConfirmClearArchive(false)}
              className="w-full h-[48px] rounded-[16px] text-[16px] font-semibold mt-3"
              style={{ background: "rgba(118,118,128,0.12)", color: "#007AFF" }}
            >
              Отмена
            </button>
          </IosSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Селект роли из справочника ─────────────────── */
function RoleSelect({
  value, onChange, disabled, excludeAdmin,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  excludeAdmin?: boolean;
}) {
  const options: string[] = excludeAdmin ? ROLES.filter((r) => r !== ADMIN_ROLE) : [...ROLES];
  // Старые роли вне справочника не теряем — показываем как опцию
  if (value && !options.includes(value)) options.unshift(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-3.5 text-[16px] bg-transparent outline-none appearance-none"
      style={{ color: value ? "#000" : "rgba(60,60,67,0.4)", opacity: disabled ? 0.5 : 1 }}
    >
      <option value="">Выберите роль...</option>
      {options.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}

/* ─── CHECKLISTS TAB (конструктор) ───────────────── */
function ChecklistsTab({ toast, isAdmin }: { toast: ReturnType<typeof useToast>["toast"]; isAdmin: boolean }) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newName, setNewName] = useState("");
  // Все формы — в bottom sheet (клавиатура на мобиле обрезала inline-инпуты)
  const [addQuestionSheet, setAddQuestionSheet] = useState<{ sectionId: number; sectionTitle: string } | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [editQuestionSheet, setEditQuestionSheet] = useState<{ questionId: number; text: string } | null>(null);
  const [addSectionSheet, setAddSectionSheet] = useState<{ checklistId: number } | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [renameSectionSheet, setRenameSectionSheet] = useState<{ sectionId: number; title: string } | null>(null);
  const [deleteSectionSheet, setDeleteSectionSheet] = useState<{ sectionId: number; title: string; count: number } | null>(null);

  const load = async () => {
    const { data, error } = await getSupabase()
      .from("checklists")
      .select("*, checklist_sections(*, checklist_questions(*))")
      .order("id");
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setChecklists((data as Checklist[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  /* ── Чек-листы ── */
  const addChecklist = async () => {
    if (!newName.trim()) return;
    const { data: cl, error } = await getSupabase().from("checklists").insert({ name: newName.trim() }).select().single();
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    const { error: secError } = await getSupabase().from("checklist_sections").insert({ checklist_id: cl.id, title: "Блок 1", sort_order: 0 });
    if (secError) {
      await getSupabase().from("checklists").delete().eq("id", cl.id);
      toast({ title: "Ошибка", description: "Не удалось создать блок", variant: "destructive" });
      return;
    }
    setNewName("");
    setShowAddChecklist(false);
    toast({ title: "Чек-лист создан ✓" });
    load();
  };

  /* ── Блоки ── */
  const addSection = async () => {
    if (!addSectionSheet || !newSectionTitle.trim()) return;
    const cl = checklists.find((c) => c.id === addSectionSheet.checklistId);
    const maxOrder = cl && cl.checklist_sections.length > 0
      ? Math.max(...cl.checklist_sections.map((s) => s.sort_order ?? 0))
      : -1;
    const { error } = await getSupabase().from("checklist_sections").insert({
      checklist_id: addSectionSheet.checklistId,
      title: newSectionTitle.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setNewSectionTitle("");
    setAddSectionSheet(null);
    toast({ title: "Блок добавлен ✓" });
    load();
  };

  const renameSection = async () => {
    if (!renameSectionSheet || !renameSectionSheet.title.trim()) return;
    const { error } = await getSupabase()
      .from("checklist_sections")
      .update({ title: renameSectionSheet.title.trim() })
      .eq("id", renameSectionSheet.sectionId);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setRenameSectionSheet(null);
    toast({ title: "Блок переименован ✓" });
    load();
  };

  const deleteSection = async () => {
    if (!deleteSectionSheet) return;
    const sb = getSupabase();
    // Сначала вопросы блока, затем сам блок
    const delQ = await sb.from("checklist_questions").delete().eq("section_id", deleteSectionSheet.sectionId);
    if (delQ.error) { toast({ title: "Ошибка", description: delQ.error.message, variant: "destructive" }); return; }
    const delS = await sb.from("checklist_sections").delete().eq("id", deleteSectionSheet.sectionId);
    if (delS.error) { toast({ title: "Ошибка", description: delS.error.message, variant: "destructive" }); return; }
    setDeleteSectionSheet(null);
    toast({ title: "Блок удалён" });
    load();
  };

  const moveSection = async (cl: Checklist, index: number, dir: -1 | 1) => {
    const secs = [...cl.checklist_sections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const j = index + dir;
    if (j < 0 || j >= secs.length) return;
    [secs[index], secs[j]] = [secs[j], secs[index]];
    const sb = getSupabase();
    const results = await Promise.all(
      secs.map((s, i) => sb.from("checklist_sections").update({ sort_order: i }).eq("id", s.id))
    );
    if (results.some((r) => r.error)) {
      toast({ title: "Ошибка", description: "Не удалось изменить порядок", variant: "destructive" });
    }
    load();
  };

  /* ── Вопросы ── */
  const addQuestion = async () => {
    if (!addQuestionSheet || !newQuestion.trim()) return;
    const section = checklists.flatMap((c) => c.checklist_sections).find((s) => s.id === addQuestionSheet.sectionId);
    const maxOrder = section && section.checklist_questions.length > 0
      ? Math.max(...section.checklist_questions.map((q) => q.sort_order ?? 0))
      : -1;
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

  const saveQuestionEdit = async () => {
    if (!editQuestionSheet || !editQuestionSheet.text.trim()) return;
    const { error } = await getSupabase()
      .from("checklist_questions")
      .update({ question_text: editQuestionSheet.text.trim() })
      .eq("id", editQuestionSheet.questionId);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setEditQuestionSheet(null);
    toast({ title: "Вопрос обновлён ✓" });
    load();
  };

  const deleteQuestion = async (questionId: number) => {
    const { error } = await getSupabase().from("checklist_questions").delete().eq("id", questionId);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const moveQuestion = async (sec: Section, index: number, dir: -1 | 1) => {
    const qs = [...sec.checklist_questions].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const j = index + dir;
    if (j < 0 || j >= qs.length) return;
    [qs[index], qs[j]] = [qs[j], qs[index]];
    const sb = getSupabase();
    const results = await Promise.all(
      qs.map((q, i) => sb.from("checklist_questions").update({ sort_order: i }).eq("id", q.id))
    );
    if (results.some((r) => r.error)) {
      toast({ title: "Ошибка", description: "Не удалось изменить порядок", variant: "destructive" });
    }
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
      {!isAdmin && (
        <div className="rounded-2xl p-4 text-[13px] leading-snug" style={{ background: "rgba(0,122,255,0.08)", color: "#0A6CD6" }}>
          Режим просмотра. Редактировать чек-листы может только «{ADMIN_ROLE}».
        </div>
      )}

      {isAdmin && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddChecklist(true)}
          className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
          style={{ background: "#007AFF", color: "#fff", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}
        >
          <Plus className="h-5 w-5" /> Новый чек-лист
        </motion.button>
      )}

      {checklists.map((cl) => {
        const sortedSections = [...cl.checklist_sections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return (
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
                  {cl.checklist_sections.length} блоков · {cl.checklist_sections.reduce((sum, s) => sum + s.checklist_questions.length, 0)} вопросов
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
                  {sortedSections.map((sec, si) => {
                    const sortedQuestions = [...sec.checklist_questions].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                    return (
                      <div key={sec.id} className="px-4 py-3" style={{ borderTop: si > 0 ? "0.5px solid rgba(60,60,67,0.08)" : "none" }}>
                        {/* Заголовок блока + управление */}
                        <div className="flex items-center gap-1 mb-2">
                          <p className="flex-1 text-[12px] font-semibold min-w-0 truncate" style={{ color: "rgba(60,60,67,0.45)", letterSpacing: "0.5px" }}>
                            {(sec.title ?? "Блок").toUpperCase()}
                          </p>
                          {isAdmin && (
                            <div className="flex gap-1 flex-shrink-0">
                              <MiniBtn disabled={si === 0} onClick={() => moveSection(cl, si, -1)}>
                                <ArrowUp className="h-3 w-3" />
                              </MiniBtn>
                              <MiniBtn disabled={si === sortedSections.length - 1} onClick={() => moveSection(cl, si, 1)}>
                                <ArrowDown className="h-3 w-3" />
                              </MiniBtn>
                              <MiniBtn onClick={() => setRenameSectionSheet({ sectionId: sec.id, title: sec.title ?? "" })}>
                                <Pencil className="h-3 w-3" />
                              </MiniBtn>
                              <MiniBtn
                                danger
                                onClick={() => setDeleteSectionSheet({ sectionId: sec.id, title: sec.title ?? "Блок", count: sec.checklist_questions.length })}
                              >
                                <Trash2 className="h-3 w-3" />
                              </MiniBtn>
                            </div>
                          )}
                        </div>

                        {/* Вопросы блока */}
                        <div className="space-y-0">
                          {sortedQuestions.map((q, qi) => (
                            <div
                              key={q.id}
                              className="flex items-start gap-2 py-2.5"
                              style={{ borderTop: qi > 0 ? "0.5px solid rgba(60,60,67,0.08)" : "none" }}
                            >
                              {isAdmin ? (
                                <button
                                  onClick={() => setEditQuestionSheet({ questionId: q.id, text: q.question_text })}
                                  className="flex-1 min-w-0 text-left text-[14px] leading-snug active:opacity-60"
                                  style={{ color: "#000" }}
                                >
                                  {q.question_text}
                                </button>
                              ) : (
                                <span className="flex-1 min-w-0 text-[14px] leading-snug" style={{ color: "#000" }}>
                                  {q.question_text}
                                </span>
                              )}
                              {isAdmin && (
                                <div className="flex gap-1 flex-shrink-0 mt-0.5">
                                  <MiniBtn disabled={qi === 0} onClick={() => moveQuestion(sec, qi, -1)}>
                                    <ArrowUp className="h-3 w-3" />
                                  </MiniBtn>
                                  <MiniBtn disabled={qi === sortedQuestions.length - 1} onClick={() => moveQuestion(sec, qi, 1)}>
                                    <ArrowDown className="h-3 w-3" />
                                  </MiniBtn>
                                  <MiniBtn danger onClick={() => deleteQuestion(q.id)}>
                                    <X className="h-3 w-3" />
                                  </MiniBtn>
                                </div>
                              )}
                            </div>
                          ))}
                          {sortedQuestions.length === 0 && (
                            <p className="py-2 text-[13px]" style={{ color: "rgba(60,60,67,0.4)" }}>Нет вопросов</p>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => { setAddQuestionSheet({ sectionId: sec.id, sectionTitle: sec.title ?? "Блок" }); setNewQuestion(""); }}
                            className="mt-2 flex items-center gap-1.5 text-[14px] active:opacity-60"
                            style={{ color: "#007AFF" }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Добавить вопрос
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isAdmin && (
                    <div className="px-4 pb-4 pt-1">
                      <button
                        onClick={() => { setAddSectionSheet({ checklistId: cl.id }); setNewSectionTitle(""); }}
                        className="w-full py-2.5 rounded-[12px] text-[14px] font-medium flex items-center justify-center gap-1.5 active:opacity-60"
                        style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}
                      >
                        <Plus className="h-4 w-4" /> Добавить блок
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Sheet: добавить вопрос */}
      <AnimatePresence>
        {addQuestionSheet && (
          <IosSheet title={`Вопрос · ${addQuestionSheet.sectionTitle}`} onClose={() => setAddQuestionSheet(null)}>
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
              style={{ background: newQuestion.trim() ? "#007AFF" : "rgba(0,122,255,0.3)", color: "#fff" }}
            >
              <Check className="h-5 w-5" /> Добавить
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Sheet: редактировать вопрос */}
      <AnimatePresence>
        {editQuestionSheet && (
          <IosSheet title="Редактировать вопрос" onClose={() => setEditQuestionSheet(null)}>
            <textarea
              className="w-full px-4 py-3.5 text-[16px] rounded-[16px] outline-none resize-none"
              style={{ background: "rgba(118,118,128,0.08)", color: "#000", minHeight: 100 }}
              placeholder="Текст вопроса..."
              value={editQuestionSheet.text}
              onChange={(e) => setEditQuestionSheet((s) => s && ({ ...s, text: e.target.value }))}
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={saveQuestionEdit}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold mt-3 flex items-center justify-center gap-2"
              style={{ background: editQuestionSheet.text.trim() ? "#007AFF" : "rgba(0,122,255,0.3)", color: "#fff" }}
            >
              <Check className="h-5 w-5" /> Сохранить
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Sheet: добавить блок */}
      <AnimatePresence>
        {addSectionSheet && (
          <IosSheet title="Новый блок" onClose={() => setAddSectionSheet(null)}>
            <input
              className="w-full px-4 py-3.5 text-[16px] rounded-[16px] outline-none"
              style={{ background: "rgba(118,118,128,0.08)" }}
              placeholder="Название блока (например: 1. Подготовка)"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={addSection}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold mt-4 flex items-center justify-center gap-2"
              style={{ background: newSectionTitle.trim() ? "#007AFF" : "rgba(0,122,255,0.3)", color: "#fff" }}
            >
              <Plus className="h-5 w-5" /> Добавить
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Sheet: переименовать блок */}
      <AnimatePresence>
        {renameSectionSheet && (
          <IosSheet title="Название блока" onClose={() => setRenameSectionSheet(null)}>
            <input
              className="w-full px-4 py-3.5 text-[16px] rounded-[16px] outline-none"
              style={{ background: "rgba(118,118,128,0.08)" }}
              placeholder="Название блока"
              value={renameSectionSheet.title}
              onChange={(e) => setRenameSectionSheet((s) => s && ({ ...s, title: e.target.value }))}
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={renameSection}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold mt-4 flex items-center justify-center gap-2"
              style={{ background: renameSectionSheet.title.trim() ? "#007AFF" : "rgba(0,122,255,0.3)", color: "#fff" }}
            >
              <Check className="h-5 w-5" /> Сохранить
            </motion.button>
          </IosSheet>
        )}
      </AnimatePresence>

      {/* Sheet: удалить блок */}
      <AnimatePresence>
        {deleteSectionSheet && (
          <IosSheet title="Удалить блок?" onClose={() => setDeleteSectionSheet(null)}>
            <p className="text-[15px] px-1 mb-4" style={{ color: "rgba(60,60,67,0.7)" }}>
              «{deleteSectionSheet.title}» и {deleteSectionSheet.count} вопрос(ов) будут удалены безвозвратно.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={deleteSection}
              className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "#FF3B30", color: "#fff" }}
            >
              <Trash2 className="h-5 w-5" /> Удалить блок
            </motion.button>
            <button
              onClick={() => setDeleteSectionSheet(null)}
              className="w-full h-[48px] rounded-[16px] text-[16px] font-semibold mt-3"
              style={{ background: "rgba(118,118,128,0.12)", color: "#007AFF" }}
            >
              Отмена
            </button>
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

/* ─── Мини-кнопка управления (порядок/правка/удаление) ── */
function MiniBtn({
  children, onClick, disabled, danger,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-6 h-6 rounded-full flex items-center justify-center active:opacity-60"
      style={{
        background: danger ? "rgba(255,59,48,0.1)" : "rgba(60,60,67,0.08)",
        color: danger ? "#FF3B30" : "rgba(60,60,67,0.55)",
        opacity: disabled ? 0.3 : 1,
      }}
    >
      {children}
    </button>
  );
}

/* ─── ROLES TAB ──────────────────────────────────── */
function RolesTab() {
  const { currentUser, isAdmin, logout } = useCurrentUser();
  const info = [
    { label: "Версия", value: "1.3.0" },
    { label: "База данных", value: "Supabase" },
    { label: "Платформа", value: "Telegram Mini App" },
  ];

  return (
    <div className="space-y-4">
      {/* Текущий пользователь */}
      {currentUser && (
        <div>
          <p className="text-[13px] font-semibold px-1 mb-2" style={{ color: "rgba(60,60,67,0.6)" }}>
            ВЫ ВОШЛИ КАК
          </p>
          <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[17px] font-bold flex-shrink-0"
                style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium truncate flex items-center gap-1.5" style={{ color: "#000" }}>
                  {currentUser.name}
                  {isAdmin && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
                      Админ
                    </span>
                  )}
                </div>
                <div className="text-[13px] truncate" style={{ color: "rgba(60,60,67,0.5)" }}>{currentUser.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-[15px] font-medium active:opacity-60"
              style={{ borderTop: "0.5px solid rgba(60,60,67,0.12)", color: "#FF3B30" }}
            >
              <LogOut className="h-4 w-4" /> Сменить пользователя
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="text-[13px] font-semibold px-1 mb-2" style={{ color: "rgba(60,60,67,0.6)" }}>
          СПРАВОЧНИК РОЛЕЙ
        </p>
        <div className="rounded-[20px] overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {ROLES.map((role, idx) => (
            <div
              key={role}
              className="flex items-center gap-2 px-4 py-3.5"
              style={{ borderTop: idx > 0 ? "0.5px solid rgba(60,60,67,0.12)" : "none" }}
            >
              <span className="text-[14px] font-medium flex-1 leading-snug" style={{ color: "#000" }}>{role}</span>
              {role === ADMIN_ROLE && (
                <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
                  Администратор
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-[12px] px-1 mt-2 leading-snug" style={{ color: "rgba(60,60,67,0.45)" }}>
          Администратор может менять роли сотрудников, удалять сотрудников и редактировать чек-листы.
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
