export interface Question {
  id?: string;
  text: string;
}

export interface Checklist {
  id: string;
  name: string;
  category: string;
  questions: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export const CHECKLISTS: Checklist[] = [
  { id: "1", name: "Customer Service", category: "Service", questions: [
    "Greeted customers warmly",
    "Maintained eye contact during interaction",
    "Resolved complaints effectively",
    "Offered additional assistance",
    "Said farewell professionally"
  ]},
  { id: "2", name: "Food Safety", category: "Safety", questions: [
    "Followed handwashing protocol",
    "Checked temperature logs",
    "Labeled all food containers properly",
    "Maintained clean workspace",
    "Stored ingredients at correct temperatures",
    "Followed allergen procedures"
  ]},
  { id: "3", name: "Opening Procedure", category: "Operations", questions: [
    "Arrived on time",
    "Completed cleaning checklist",
    "Checked inventory levels",
    "Set up POS system correctly",
    "Briefed team on daily specials",
    "Tested all equipment",
    "Unlocked premises at correct time"
  ]},
  { id: "4", name: "Closing Procedure", category: "Operations", questions: [
    "Completed end-of-day reconciliation",
    "Cleaned and sanitized all surfaces",
    "Secured cash properly",
    "Locked all access points",
    "Submitted daily report"
  ]}
];

export const EMPLOYEES: Employee[] = [
  { id: "1", name: "Alex Johnson", role: "Shift Manager" },
  { id: "2", name: "Maria Santos", role: "Barista" },
  { id: "3", name: "David Kim", role: "Cashier" },
  { id: "4", name: "Sophie Chen", role: "Barista" },
  { id: "5", name: "James Williams", role: "Kitchen Staff" },
  { id: "6", name: "Emma Davis", role: "Floor Staff" }
];
