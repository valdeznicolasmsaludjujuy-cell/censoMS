import { createFileRoute } from "@tanstack/react-router";
import { Planilla } from "@/components/personal/Planilla";

export const Route = createFileRoute("/_authenticated/controlados")({
  head: () => ({
    meta: [
      { title: "Datos controlados — Gestión de Personal" },
      { name: "description", content: "Datos controlados del personal del Ministerio de Salud." },
      { property: "og:title", content: "Datos controlados — Gestión de Personal" },
      { property: "og:description", content: "Datos controlados del personal del Ministerio de Salud." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Planilla controlado={true} titulo="Datos controlados" />,
});
