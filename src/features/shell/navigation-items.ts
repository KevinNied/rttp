import {
  Activity,
  CalendarDays,
  Dumbbell,
  House,
  LayoutGrid,
  ListChecks,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AthleteView, CoachView } from "@/application/navigation/routes";

export type NavigationItem = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  view: CoachView | AthleteView;
};

export const coachNavigation: NavigationItem[] = [
  {
    icon: LayoutGrid,
    label: "Resumen",
    description: "Vista general",
    href: "/coach",
    view: "resumen",
  },
  {
    icon: Users,
    label: "Atletas",
    description: "Gestioná tus alumnos",
    href: "/coach/athletes",
    view: "atletas",
  },
  {
    icon: ListChecks,
    label: "Rutinas",
    description: "Plantillas y planes",
    href: "/coach/routines",
    view: "routines",
  },
  {
    icon: UserRound,
    label: "Perfil",
    description: "Cuenta y apariencia",
    href: "/coach/profile",
    view: "profile",
  },
];

export const athleteNavigation: NavigationItem[] = [
  {
    icon: House,
    label: "Inicio",
    description: "Tu entrenamiento de hoy",
    href: "/",
    view: "inicio",
  },
  {
    icon: Dumbbell,
    label: "Rutinas",
    description: "Todos tus planes",
    href: "/routines",
    view: "routines",
  },
  {
    icon: CalendarDays,
    label: "Agenda",
    description: "Organizá tu semana",
    href: "/schedule",
    view: "agenda",
  },
  {
    icon: Activity,
    label: "Progreso",
    description: "Tu historial deportivo",
    href: "/activities",
    view: "activities",
  },
  {
    icon: UserRound,
    label: "Perfil",
    description: "Tu cuenta",
    href: "/profile",
    view: "profile",
  },
];
