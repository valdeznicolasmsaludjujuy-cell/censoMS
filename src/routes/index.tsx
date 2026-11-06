import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestión de Personal — Ministerio de Salud" },
      { name: "description", content: "Planilla de control de datos del personal." },
      { property: "og:title", content: "Gestión de Personal — Ministerio de Salud" },
      { property: "og:description", content: "Planilla de control de datos del personal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/planilla" });
  },
});
