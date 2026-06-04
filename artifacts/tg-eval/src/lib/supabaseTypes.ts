export interface DbChecklist {
  id: number;
  name: string;
  category: string | null;
  created_at?: string;
}

export interface DbChecklistSection {
  id: number;
  checklist_id: number;
  title: string;
  order_index: number | null;
  created_at?: string;
}

export interface DbChecklistQuestion {
  id: number;
  section_id: number;
  text: string;
  order_index: number | null;
  created_at?: string;
}

export interface DbChecklistWithNested extends DbChecklist {
  checklist_sections: Array<
    DbChecklistSection & {
      checklist_questions: DbChecklistQuestion[];
    }
  >;
}
