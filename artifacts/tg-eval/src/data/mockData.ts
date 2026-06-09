export interface Question {
  id?: string;
  text: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  questions: string[];
}

export interface Checklist {
  id: string;
  name: string;
  category: string;
  /** Вопросы, сгруппированные по блокам (разделам) */
  sections: ChecklistSection[];
  /** Плоский список вопросов (sections.flatMap) — для обратной совместимости */
  questions: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  canEvaluate?: boolean;
}

export const CHECKLISTS: Checklist[] = [
  {
    id: "1",
    name: "Полевое сопровождение менеджера",
    category: "Field",
    questions: [
      "Изучил ли сотрудник информацию о селлере заранее",
      "Понимает ли нишу / товар селлера",
      "Подготовил ли аргументы/примеры под конкретного селлера",
    ],
  },
  {
    id: "2",
    name: "Оценка Team Leader",
    category: "Management",
    questions: [
      "Подготовился к Weekly",
      "Провел разбор KPI сотрудников",
      "Дал конструктивную обратную связь",
      "Согласовал план действий",
      "Вел протокол встречи",
    ],
  },
  {
    id: "3",
    name: "Оценка Team Leader V2",
    category: "Management",
    questions: [
      "Подготовка к встрече",
      "Управление встречей",
      "Анализ результатов команды",
      "Обратная связь",
      "Постановка задач",
      "Работа с командой",
      "Протокол встречи",
    ],
  },
];

export const EMPLOYEES: Employee[] = [
  {
    id: "1",
    name: "Менеджер по привлечению партнеров",
    role: "Менеджер",
  },
  {
    id: "2",
    name: "Team Leader",
    role: "Team Leader",
  },
  {
    id: "3",
    name: "Диер О",
    role: "Руководитель отдела",
  },
  {
    id: "4",
    name: "Азамат",
    role: "Бизнес Поддержка",
  },
];
