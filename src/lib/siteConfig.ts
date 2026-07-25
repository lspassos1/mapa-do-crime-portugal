// Configuração base para SEO/metadata. O URL canónico pode ser sobreposto por
// ambiente (NEXT_PUBLIC_SITE_URL).
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mapa-do-crime-portugal.vercel.app";

export const siteConfig = {
  name: "Mapa do Crime Portugal",
  description:
    "Criminalidade registada pelas forças de segurança em Portugal, por concelho — com destaque para a violência doméstica. Dados oficiais do INE/DGPJ.",
  url: rawSiteUrl.replace(/\/$/, ""),
  locale: "pt_PT",
} as const;

// A moldura editorial do produto, num só lugar.
export const MOLDURA = {
  unidade: "crimes registados (participações às forças de segurança)",
  avisoCentral:
    "Crime registado não é crime ocorrido: mede o que foi participado à PSP/GNR. Mais participações podem significar mais crime — ou mais confiança para denunciar.",
  emergencia: "112",
} as const;
