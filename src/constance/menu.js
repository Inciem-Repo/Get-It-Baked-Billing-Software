import {
  Receipt,
  History,
  Printer,
  BarChart2,
  DollarSign,
  FileMinus,
  ChevronDown,
  CookingPot,
  NotebookPen,
} from "lucide-react";

export const menuItems = [
  { id: "", label: "POS", icon: Receipt },
  { id: "billing-history", label: "Billing History", icon: History },
  { id: "advance-billing", label: "Advance order", icon: NotebookPen },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart2,
    children: [
      { id: "sales-report", label: "Sales Report", icon: DollarSign },
      { id: "payment-report", label: "Payment Report", icon: History },
      { id: "expense", label: "Expense Report", icon: FileMinus },
    ],
  },

  // { id: "create-kot", label: "KOT", icon: CookingPot },
  { id: "printer-settings", label: "Printer Settings", icon: Printer },
];
