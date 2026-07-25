import type { Metadata } from "next";
import { MapaDashboard } from "@/components/MapaDashboard";

export const metadata: Metadata = {
  title: "O mapa — criminalidade registada por concelho",
  description:
    "Criminalidade registada pelas forças de segurança em Portugal, por concelho e por taxa por 100 mil habitantes. Dados INE/DGPJ.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <MapaDashboard />;
}
