import {
  Receipt,
  History,
  Printer,
  BarChart2,
  DollarSign,
  FileMinus,
  ChevronDown,
  CookingPot,
  LayoutDashboard,
  NotebookPen,
  Settings,
} from "lucide-react";
import KOTSettings from "../components/KOTSettings";
import PrintSettings from "../components/PrintSettings";

export const menuItems = [
  { id: "", label: "Dashboard", icon: LayoutDashboard },
  { id: "pos", label: "POS", icon: Receipt },
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

  { id: "kot", label: "KOT", icon: CookingPot },
  { id: "settings", label: "Settings", icon: Settings },
];

export const settingsMenuItems = [
  {
    id: "kot",
    label: "KOT Settings",
    component: KOTSettings,
  },
  {
    id: "print",
    label: "Print Settings",
    component: PrintSettings,
  },
  //ref for child routes support
  // {
  //   id: "advanced",
  //   label: "Advanced Settings",
  //   children: [
  //     {
  //       id: "security",
  //       label: "Security",
  //       component: SecuritySettings,
  //     },
  //     {
  //       id: "backup",
  //       label: "Backup & Restore",
  //       component: BackupSettings,
  //     },
  //     {
  //       id: "system",
  //       label: "System Settings",
  //       component: SystemSettings,
  //     },
  //   ],
  // },
];
