import { createFileRoute } from "@tanstack/react-router";
import { Planilla } from "@/components/personal/Planilla";

export const Route = createFileRoute("/_authenticated/planilla")({
  head: () => ({
    meta: [
      { title: "Planilla a completar — Gestión de Personal" },
      { name: "description", content: "Planilla a completar del personal del Ministerio de Salud." },
      { property: "og:title", content: "Planilla a completar — Gestión de Personal" },
      { property: "og:description", content: "Planilla a completar del personal del Ministerio de Salud." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Planilla controlado={false} titulo="Planilla a completar" />,
});
