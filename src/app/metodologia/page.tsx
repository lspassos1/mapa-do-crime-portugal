import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { ANOS, FONTE } from "@/lib/crime";

export const metadata: Metadata = {
  title: "Metodologia",
  description:
    "De onde vêm os números, o que eles medem — e sobretudo o que NÃO medem. Crime registado não é crime ocorrido.",
  alternates: { canonical: "/metodologia" },
};

export default function MetodologiaPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg0 text-ink">
      <AppHeader />

      <div className="border-b border-line px-7 pb-[30px] pt-[34px]">
        <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[.28em] text-sec">
          <span className="inline-block h-px w-[22px] bg-quat" />
          METODOLOGIA
        </div>
        <h1 className="mt-3 text-[32px] font-[620] leading-[1.04] tracking-[-0.015em] [font-stretch:115%] sm:text-[42px]">
          O que este mapa não vê
        </h1>
        <p className="mt-3 max-w-[720px] text-[14px] leading-[1.65] text-ter">
          Todo o número aqui é <strong className="text-sec">crime participado às forças de segurança</strong>. Entre o
          crime que acontece e o crime que é registado há uma distância — a <em>cifra negra</em> — e ela não é igual
          para todos os crimes nem para todos os sítios. Esta página é sobre essa distância.
        </p>
      </div>

      {/* 3 princípios */}
      <div className="grid grid-cols-1 border-b border-line md:grid-cols-3">
        <div className="border-r border-hair px-[26px] py-7">
          <div className="font-mono text-[30px] text-ghost2">01</div>
          <h2 className="mt-3 text-[20px] font-[620] leading-[1.3] [font-stretch:110%]">Registado ≠ ocorrido.</h2>
          <p className="mt-2 text-[13px] leading-[1.65] text-ter">
            Mais participações podem significar <span className="text-[#C9C7C1]">mais crime</span> — ou{" "}
            <span className="text-[#C9C7C1]">mais confiança para denunciar</span>. Um concelho que sobe no mapa pode
            estar a piorar, ou a deixar de se calar.
          </p>
        </div>
        <div className="border-r border-hair px-[26px] py-7">
          <div className="font-mono text-[30px] text-ghost2">02</div>
          <h2 className="mt-3 text-[20px] font-[620] leading-[1.3] [font-stretch:110%]">O denominador mente.</h2>
          <p className="mt-2 text-[13px] leading-[1.65] text-ter">
            A taxa divide por <span className="text-[#C9C7C1]">residentes</span>. Onde há muitos visitantes (Algarve) ou
            poucos habitantes, a taxa dispara sem que a vida de quem lá mora seja mais perigosa.
          </p>
        </div>
        <div className="px-[26px] py-7">
          <div className="font-mono text-[30px] text-ghost2">03</div>
          <h2 className="mt-3 text-[20px] font-[620] leading-[1.3] [font-stretch:110%]">Nunca é acusação.</h2>
          <p className="mt-2 text-[13px] leading-[1.65] text-ter">
            O mapa mostra <span className="text-[#C9C7C1]">onde olhar</span> — não conclui sobre pessoas, bairros ou
            comunidades. Código aberto sob <span className="text-[#C9C7C1]">AGPL-3.0</span>, auditável.
          </p>
        </div>
      </div>

      {/* as distorções conhecidas */}
      <div className="border-b border-line px-7 py-[26px]">
        <h2 className="mb-3.5 font-mono text-[9.5px] tracking-[.24em] text-quat">AS DISTORÇÕES QUE CONHECEMOS</h2>
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2">
          {[
            [
              "Turismo infla a taxa",
              "Albufeira e Vila do Bispo lideram o ranking de criminalidade geral por 100 mil residentes. O crime é real, mas grande parte ocorre sobre uma população flutuante que o denominador ignora. Leia estes concelhos como 'muito movimento', não 'muito perigo para quem mora'.",
            ],
            [
              "Concelhos pequenos oscilam",
              "Num concelho de 2 000 habitantes, meia dúzia de ocorrências a mais dispara a taxa. Por isso o ranking traz um piso de 20 mil habitantes por omissão — o mapa, esse, mostra todos.",
            ],
            [
              "Violência doméstica: subnotificação estrutural",
              "É o crime com maior cifra negra. Estimativas de organizações de apoio às vítimas apontam para uma fração das ocorrências reais a chegar às autoridades. Uma subida pode ser boa notícia (mais denúncia) — nunca se lê isoladamente.",
            ],
            [
              "Homicídio é raro demais para mapear",
              "Portugal regista poucas dezenas de homicídios por ano em 308 concelhos. A esse volume, a maioria dos concelhos fica a zero e a variação anual é ruído. Por isso o produto não se organiza em torno do homicídio — ao contrário do que faria no Brasil.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="bg-panel px-5 py-5">
              <h3 className="text-[15px] font-[620] text-ink">{t}</h3>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-ter">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* fontes */}
      <div className="grid grid-cols-1 border-b border-line md:grid-cols-2">
        <div className="border-r border-hair px-7 py-[26px]">
          <h2 className="mb-3.5 font-mono text-[9.5px] tracking-[.24em] text-quat">FONTES</h2>
          <div className="flex flex-col gap-2.5 text-[13px] leading-[1.5]">
            {(
              [
                ["INE / DGPJ", "Crimes registados pelas autoridades policiais, por concelho e categoria (indicador 0012261). Fonte primária: Direção-Geral da Política de Justiça."],
                ["INE", "População residente por concelho — denominador da taxa por 100 mil."],
                ["CAOP / DGT", "Carta Administrativa Oficial de Portugal: geometria dos 308 concelhos (CC-BY-4.0)."],
                ["RASI", "Relatório Anual de Segurança Interna — referência para validar os totais nacionais."],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <span className="w-[110px] flex-none pt-0.5 font-mono text-[10px] text-quat">{k}</span>
                <span className="text-sec">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[9px] leading-[1.8] tracking-[.06em] text-quat">
            SÉRIE DISPONÍVEL: {ANOS[0]}–{ANOS[ANOS.length - 1]} · O INDICADOR USA A REVISÃO NUTS-2024, QUE NÃO RECUA
            ALÉM DE {ANOS[0]}. O ÚLTIMO ANO É PROVISÓRIO.
          </p>
        </div>
        <div className="px-7 py-[26px]">
          <h2 className="mb-3.5 font-mono text-[9.5px] tracking-[.24em] text-quat">AVISOS</h2>
          <div className="flex flex-col gap-3.5">
            <div className="border-l-2 border-registro py-0.5 pl-3.5">
              <h3 className="text-[13.5px] font-semibold text-ink">Não é um serviço de emergência</h3>
              <p className="mt-1 text-[12.5px] leading-[1.6] text-ter">
                Em perigo, ligue <span className="font-semibold text-registro">112</span>. Violência doméstica:{" "}
                <span className="font-semibold text-registro">800 202 148</span> (gratuita, 24h).
              </p>
            </div>
            <div className="border-l-2 border-indicio py-0.5 pl-3.5">
              <h3 className="text-[13.5px] font-semibold text-ink">Não mede risco individual</h3>
              <p className="mt-1 text-[12.5px] leading-[1.6] text-ter">
                Uma taxa concelhia não diz nada sobre a sua rua nem sobre a sua noite. Não use este mapa para decidir
                sobre pessoas, arrendamentos ou vigilância.
              </p>
            </div>
            <div className="border-l-2 border-quat py-0.5 pl-3.5">
              <h3 className="text-[13.5px] font-semibold text-ink">Os dados mudam depois de publicados</h3>
              <p className="mt-1 text-[12.5px] leading-[1.6] text-ter">
                Registos são revistos, reclassificados e corrigidos. O último ano da série é sempre o mais frágil.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="px-7 py-5 font-mono text-[9px] leading-[1.9] tracking-[.08em] text-quat">
        FONTE COMPLETA — {FONTE.toUpperCase()}
      </p>
    </main>
  );
}
