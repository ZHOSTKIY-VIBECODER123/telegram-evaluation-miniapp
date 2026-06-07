import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";

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

const TABS = ["Сотрудники", "Чек-листы", "Роли"] as const;
type Tab = (typeof TABS)[number];

export default function Settings() {
  const [tab, setTab] = useState<Tab>("Сотрудники");
  const { toast } = useToast();

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <header className="py-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Администрирование</p>
      </header>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Сотрудники" && <EmployeesTab toast={toast} />}
      {tab === "Чек-листы" && <ChecklistsTab toast={toast} />}
      {tab === "Роли" && <RolesTab />}
    </div>
  );
}

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
    toast({ title: "Сотрудник добавлен" });
    setShowAdd(false);
    setForm({ full_name: "", role: "", can_evaluate: false });
    load();
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const { error } = await getSupabase().from("employees").update({
      full_name: editTarget.full_name,
      role: editTarget.role,
      can_evaluate: editTarget.can_evaluate,
    }).eq("id", editTarget.id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Сохранено" });
    setEditTarget(null);
    load();
  };

  const toggleActive = async (emp: Employee) => {
    await getSupabase().from("employees").update({ active: !emp.active }).eq("id", emp.id);
    load();
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8" />;

  return (
    <div className="space-y-3">
      <Button size="sm" className="w-full" onClick={() => setShowAdd(true)}>
        <Plus className="h-4 w-4 mr-1" /> Добавить сотрудника
      </Button>

      {employees.map((emp) => (
        <Card key={emp.id} className={emp.active ? "" : "opacity-50"}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{emp.full_name}</div>
                <div className="text-sm text-muted-foreground">{emp.role}</div>
                <div className="flex gap-1 mt-1">
                  {emp.can_evaluate && <Badge variant="secondary" className="text-xs">Оценщик</Badge>}
                  {!emp.active && <Badge variant="destructive" className="text-xs">Неактивен</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTarget({ ...emp })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleActive(emp)}
                  title={emp.active ? "Деактивировать" : "Активировать"}
                >
                  {emp.active ? <Trash2 className="h-4 w-4 text-red-500" /> : <Plus className="h-4 w-4 text-green-600" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новый сотрудник</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Имя" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            <Input placeholder="Роль" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.can_evaluate} onChange={(e) => setForm((f) => ({ ...f, can_evaluate: e.target.checked }))} />
              Может проводить оценку
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Отмена</Button>
            <Button onClick={saveNew}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <Input value={editTarget.full_name} onChange={(e) => setEditTarget((t) => t && ({ ...t, full_name: e.target.value }))} />
              <Input value={editTarget.role} onChange={(e) => setEditTarget((t) => t && ({ ...t, role: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editTarget.can_evaluate} onChange={(e) => setEditTarget((t) => t && ({ ...t, can_evaluate: e.target.checked }))} />
                Может проводить оценку
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Отмена</Button>
            <Button onClick={saveEdit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChecklistsTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [addingQuestion, setAddingQuestion] = useState<{ checklistId: number; sectionId: number } | null>(null);
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
    await getSupabase().from("checklist_sections").insert({ checklist_id: cl.id, title: "Раздел 1", sort_order: 0 });
    setNewName("");
    toast({ title: "Чек-лист создан" });
    load();
  };

  const addQuestion = async () => {
    if (!addingQuestion || !newQuestion.trim()) return;
    const section = checklists
      .flatMap((c) => c.checklist_sections)
      .find((s) => s.id === addingQuestion.sectionId);
    const maxOrder = section ? Math.max(0, ...section.checklist_questions.map((q) => q.sort_order)) : 0;
    const { error } = await getSupabase().from("checklist_questions").insert({
      section_id: addingQuestion.sectionId,
      question_text: newQuestion.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setNewQuestion("");
    setAddingQuestion(null);
    toast({ title: "Вопрос добавлен" });
    load();
  };

  const deleteQuestion = async (questionId: number) => {
    const { error } = await getSupabase().from("checklist_questions").delete().eq("id", questionId);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    load();
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Название нового чек-листа" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button size="sm" onClick={addChecklist}><Plus className="h-4 w-4" /></Button>
      </div>

      {checklists.map((cl) => (
        <Card key={cl.id}>
          <CardContent className="p-4">
            <button
              className="w-full flex items-center justify-between font-semibold text-left"
              onClick={() => setExpanded(expanded === cl.id ? null : cl.id)}
            >
              {cl.name}
              {expanded === cl.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {expanded === cl.id && (
              <div className="mt-3 space-y-3">
                {cl.checklist_sections.sort((a, b) => a.sort_order - b.sort_order).map((sec) => (
                  <div key={sec.id}>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{sec.title}</div>
                    <div className="space-y-1.5">
                      {sec.checklist_questions.sort((a, b) => a.sort_order - b.sort_order).map((q) => (
                        <div key={q.id} className="flex items-start gap-2 group">
                          <span className="flex-1 text-sm leading-snug">{q.question_text}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                            onClick={() => deleteQuestion(q.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {addingQuestion?.sectionId === sec.id ? (
                      <div className="flex gap-2 mt-2">
                        <Input
                          className="text-sm h-8"
                          placeholder="Текст вопроса"
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          autoFocus
                        />
                        <Button size="sm" className="h-8" onClick={addQuestion}>OK</Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => setAddingQuestion(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-muted-foreground"
                        onClick={() => { setAddingQuestion({ checklistId: cl.id, sectionId: sec.id }); setNewQuestion(""); }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Добавить вопрос
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RolesTab() {
  const roles = [
    { evaluator: "Team Leader", evaluates: "Менеджер по привлечению партнеров" },
    { evaluator: "Диер О (Руководитель отдела)", evaluates: "Team Leader" },
    { evaluator: "Азамат (Бизнес Поддержка)", evaluates: "Диер О" },
  ];

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Текущая схема "кто кого оценивает". Изменение схемы требует правки кода.
          </p>
          <div className="space-y-3">
            {roles.map((r, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">{r.evaluator}</span>
                <span className="text-muted-foreground mx-2">→</span>
                <span>{r.evaluates}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Версия приложения</span>
            <Badge variant="secondary">1.1.0</Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium">База данных</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">Supabase</Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium">Платформа</span>
            <Badge variant="secondary">Telegram Mini App</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
