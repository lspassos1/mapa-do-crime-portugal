import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  ANOS,
  ANO_RECENTE,
  fmtInt,
  fmtTaxa,
  linhas as linhasDe,
  populacaoNacional,
  serie,
  totalNacional,
} from "@/lib/crime";

export const metadata: Metadata = {
  title: "Violência doméstica",
  description:
    "Violência doméstica contra cônjuge ou análogos registada em Portugal, por concelho. O crime com maior cifra negra — uma subida pode ser mais denúncia, não mais violência.",
  alternates: { canonical: "/violencia-domestica" },
};

const PISO = 20000; // ver /metodologia: denominador pequeno vira ruído

export default function ViolenciaDomesticaPage() {
  const ano = ANO_RECENTE;
  const linhas = linhasDe(ano, "violenciaDomestica");
  const nacional = totalNacional(ano, "violenciaDomestica");
  const pop = populacaoNacional(ano);
  const taxaNac = pop ? (nacional / pop) * 1e5 : null;
  const s = serie(null, "violenciaDomestica");
  const porDia = nacional / 365;

  const elegiveis = linhas.filter((l) => (l.pop ?? 0) >= PISO && l.taxa !== null);
  const maiores = [...elegiveis].sort((a, b) => (b.taxa ?? 0) - (a.taxa ?? 0)).slice(0, 10);
  const menores = [...elegiveis].sort((a, b) => (a.taxa ?? 0) - (b.taxa ?? 0)).slice(0, 5);
  const maxTaxa = maiores[0]?.taxa ?? 1;

  return (
    <main className="flex min-h-screen flex-col bg-bg0 text-ink">
      <AppHeader />

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line px-7 pb-[26px] pt-[34px]">
        <div className="max-w-[720px]">
          <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[.28em] text-registro">
            <span className="inline-block h-px w-[22px] bg-registro" />
            A LENTE PRINCIPAL — VIOLÊNCIA DOMÉSTICA
          </div>
          <h1 className="mt-3 text-[30px] font-[620] leading-[1.04] tracking-[-0.015em] [font-stretch:115%] sm:text-[42px]">
            O crime que o mapa
            <br />
            quase não vê
          </h1>
          <p className="mt-3 text-[14px] leading-[1.65] text-ter">
            Violência doméstica contra cônjuge ou análogos, participada às forças de segurança. É o crime com maior{" "}
            <span className="text-[#C9C7C1]">cifra negra</span> em Portugal: o que aparece aqui é a ponta do que
            acontece — e uma subida pode significar <span className="text-[#C9C7C1]">mais denúncia</span>, não mais
            violência.
          </p>
        </div>
        <div className="flex-none border border-[rgba(229,72,77,.35)] bg-[rgba(229,72,77,.06)] px-4 py-3.5 font-mono text-[9.5px] leading-[2] tracking-[.14em] text-[#F0B0B3]">
          PRECISA DE AJUDA?
          <br />
          <span className="text-registro">800 202 148</span> LINHA GRATUITA 24H
          <br />
          <span className="text-registro">112</span> EMERGÊNCIA
          <br />
          <span className="text-quat">3060</span> SMS APOIO
        </div>
      </div>

      {/* números-chave */}
      <div className="grid grid-cols-1 gap-px border-b border-line bg-line sm:grid-cols-3">
        <div className="bg-panel px-7 py-6">
          <p className="font-mono text-[9px] tracking-[.2em] text-quat">PARTICIPAÇÕES EM {ano}</p>
          <p className="mt-2 text-[44px] font-[640] leading-none [font-stretch:112%]">{fmtInt(nacional)}</p>
          <p className="mt-2 text-[12.5px] leading-[1.5] text-ter">
            cerca de <span className="text-sec">{porDia.toFixed(0)} por dia</span> em todo o país
          </p>
        </div>
        <div className="bg-panel px-7 py-6">
          <p className="font-mono text-[9px] tracking-[.2em] text-quat">TAXA NACIONAL</p>
          <p className="mt-2 text-[44px] font-[640] leading-none [font-stretch:112%]">{fmtTaxa(taxaNac)}</p>
          <p className="mt-2 text-[12.5px] leading-[1.5] text-ter">por 100 mil habitantes</p>
        </div>
        <div className="bg-panel px-7 py-6">
          <p className="font-mono text-[9px] tracking-[.2em] text-quat">
            {ANOS[0]} → {ANO_RECENTE}
          </p>
          <div className="mt-3 flex h-[52px] items-end gap-1.5">
            {s.map((p) => {
              const max = Math.max(...s.map((x) => x.valor)) || 1;
              return (
                <div key={p.ano} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full bg-registro/50"
                    style={{ height: `${Math.max(6, (p.valor / max) * 44)}px` }}
                    title={`${p.ano}: ${fmtInt(p.valor)}`}
                  />
                  <span className="font-mono text-[8px] text-quat">{String(p.ano).slice(2)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] leading-[1.5] text-ter">participações por ano</p>
        </div>
      </div>

      {/* ranking */}
      <div className="grid grid-cols-1 border-b border-line lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="border-r border-hair px-7 py-[26px]">
          <h2 className="font-mono text-[9.5px] tracking-[.24em] text-quat">
            MAIORES TAXAS EM {ano} — CONCELHOS COM ≥ {fmtInt(PISO)} HABITANTES
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {maiores.map((l, i) => (
              <div key={l.dico} className="flex items-center gap-3">
                <span className="w-5 flex-none font-mono text-[9px] text-quat">{i + 1}</span>
                <span className="w-[150px] flex-none truncate text-[13px] text-[#C9C7C1]">{l.nome}</span>
                <span className="relative h-[7px] flex-1 bg-hair">
                  <span
                    className="absolute inset-y-0 left-0 bg-registro/70"
                    style={{ width: `${(((l.taxa ?? 0) / maxTaxa) * 100).toFixed(1)}%` }}
                  />
                </span>
                <span className="w-14 flex-none text-right font-mono text-[11px] text-sec">{fmtTaxa(l.taxa)}</span>
                <span className="w-16 flex-none text-right font-mono text-[10px] text-quat">{fmtInt(l.valor)} casos</span>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-hair pt-3 font-mono text-[9px] leading-[1.9] tracking-[.06em] text-quat">
            MENORES TAXAS:{" "}
            {menores.map((l) => `${l.nome.toUpperCase()} (${fmtTaxa(l.taxa)})`).join(" · ")}
          </p>
        </div>

        <aside className="bg-panel px-6 py-[26px]">
          <h2 className="font-mono text-[9.5px] tracking-[.22em] text-quat">COMO LER ESTE NÚMERO</h2>
          <div className="mt-4 flex flex-col gap-4 text-[13px] leading-[1.65] text-sec">
            <p>
              <strong className="text-ink">Uma subida não é necessariamente má notícia.</strong> Campanhas, formação
              policial e confiança nas autoridades aumentam a denúncia sem que a violência tenha aumentado.
            </p>
            <p>
              <strong className="text-ink">Uma descida não é necessariamente boa.</strong> Pode indicar que as vítimas
              deixaram de recorrer às autoridades.
            </p>
            <p>
              <strong className="text-ink">A diferença entre concelhos é sobretudo de denúncia.</strong> Ilhas e
              concelhos com forte rede de apoio surgem no topo — o que se lê é o sistema a registar, não
              necessariamente mais agressão.
            </p>
          </div>
          <p className="mt-5 border-t border-line pt-4 font-mono text-[9px] leading-[1.9] tracking-[.06em] text-indiciodim">
            ESTE INDICADOR MEDE PARTICIPAÇÕES, NÃO CONDENAÇÕES NEM PREVALÊNCIA REAL.{" "}
            <Link className="underline underline-offset-2 hover:text-indicio" href="/metodologia">
              VER METODOLOGIA
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
