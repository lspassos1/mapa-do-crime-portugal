"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ConcelhosMap, VISTAS } from "@/components/map/ConcelhosMap";
import {
  ANOS,
  ANO_RECENTE,
  CATEGORIA_CURTA,
  FONTE,
  RAMPA,
  corPara,
  escalaQuantil,
  fmtInt,
  fmtTaxa,
  linhas as linhasDe,
  populacaoNacional,
  serie,
  totalNacional,
  type CategoriaKey,
} from "@/lib/crime";

const CATEGORIAS_UI: CategoriaKey[] = [
  "total",
  "violenciaDomestica",
  "contraPatrimonio",
  "contraPessoas",
  "furtoVeiculo",
  "rouboViaPublica",
];

export function MapaDashboard() {
  const [categoria, setCategoria] = useState<CategoriaKey>("total");
  const [ano, setAno] = useState(ANO_RECENTE);
  const [metrica, setMetrica] = useState<"taxa" | "valor">("taxa");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [vista, setVista] = useState<keyof typeof VISTAS>("continente");
  // Piso populacional no RANKING (não no mapa): concelhos muito pequenos têm
  // denominador minúsculo — 30 crimes em 2.000 habitantes dão uma taxa enorme
  // que é ruído, não sinal. Ver METODOLOGIA.
  const [piso, setPiso] = useState(20000);

  const linhas = useMemo(() => linhasDe(ano, categoria), [ano, categoria]);
  const cortes = useMemo(
    () => escalaQuantil(linhas.map((l) => (metrica === "taxa" ? (l.taxa ?? NaN) : l.valor))),
    [linhas, metrica],
  );
  const ordenadas = useMemo(
    () =>
      [...linhas]
        .filter((l) => (piso ? (l.pop ?? 0) >= piso : true))
        .sort((a, b) => {
        const va = metrica === "taxa" ? (a.taxa ?? -1) : a.valor;
        const vb = metrica === "taxa" ? (b.taxa ?? -1) : b.valor;
        return vb - va;
      }),
    [linhas, metrica, piso],
  );

  const nacional = totalNacional(ano, categoria);
  const popNac = populacaoNacional(ano);
  const taxaNac = popNac ? (nacional / popNac) * 1e5 : null;
  const serieNac = useMemo(() => serie(null, categoria), [categoria]);
  const primeiro = serieNac[0];
  const ultimo = serieNac[serieNac.length - 1];
  const variacao = primeiro?.valor ? ((ultimo.valor - primeiro.valor) / primeiro.valor) * 100 : null;
  const sel = selecionado ? linhas.find((l) => l.dico === selecionado) ?? null : null;
  const posSel = sel ? ordenadas.findIndex((l) => l.dico === sel.dico) + 1 : null;

  return (
    <main className="flex min-h-screen flex-col bg-bg0 text-ink">
      <AppHeader />

      {/* cabeçalho de secção */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line px-7 pb-[22px] pt-[30px]">
        <div>
          <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[.28em] text-sec">
            <span className="inline-block h-px w-[22px] bg-quat" />
            CRIMINALIDADE REGISTADA — 308 CONCELHOS
          </div>
          <h1 className="mt-3 text-[32px] font-[620] leading-[1.02] tracking-[-0.015em] [font-stretch:115%] sm:text-[40px]">
            O país, concelho a concelho
          </h1>
          <p className="mt-2.5 max-w-[600px] text-[13.5px] leading-[1.6] text-ter">
            {CATEGORIA_CURTA[categoria]} participada às forças de segurança em {ano}. Compare pela{" "}
            <span className="text-sec">taxa por 100 mil habitantes</span> — o número absoluto favorece sempre os
            concelhos maiores.
          </p>
        </div>
        <div className="flex-none text-right font-mono text-[9.5px] leading-[2.1] tracking-[.14em] text-quat">
          <div>
            NACIONAL — <span className="text-ink">{fmtInt(nacional)}</span> REGISTOS
          </div>
          <div>
            TAXA — <span className="text-sec">{fmtTaxa(taxaNac)}</span> / 100 MIL
          </div>
          <div>
            {ANOS[0]}→{ANO_RECENTE} —{" "}
            <span className={variacao !== null && variacao <= 0 ? "text-positivo" : "text-registro"}>
              {variacao === null ? "—" : `${variacao > 0 ? "+" : "−"}${Math.abs(variacao).toFixed(1).replace(".", ",")}%`}
            </span>
          </div>
        </div>
      </div>

      {/* controlos */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-7 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[9px] tracking-[.24em] text-quat">CRIME</span>
          {CATEGORIAS_UI.map((c) => {
            const act = categoria === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                aria-pressed={act}
                className={`border px-2.5 py-1.5 font-mono text-[9.5px] tracking-[.1em] hover:border-edgehover hover:text-ink ${
                  act ? "border-ink bg-[rgba(236,234,228,.1)] text-ink" : "border-edge text-ter"
                }`}
              >
                {CATEGORIA_CURTA[c].toUpperCase()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 font-mono text-[9px] tracking-[.24em] text-quat">ANO</span>
          {ANOS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAno(a)}
              aria-pressed={ano === a}
              className={`border px-2.5 py-1.5 font-mono text-[9.5px] tracking-[.1em] hover:border-edgehover hover:text-ink ${
                ano === a ? "border-ink bg-[rgba(236,234,228,.1)] text-ink" : "border-edge text-ter"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 font-mono text-[9px] tracking-[.24em] text-quat">VISTA</span>
          {(["continente", "madeira", "acores"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              aria-pressed={vista === v}
              className={`border px-2.5 py-1.5 font-mono text-[9.5px] tracking-[.1em] hover:border-edgehover hover:text-ink ${
                vista === v ? "border-ink bg-[rgba(236,234,228,.1)] text-ink" : "border-edge text-ter"
              }`}
            >
              {v === "continente" ? "CONTINENTE" : v === "madeira" ? "MADEIRA" : "AÇORES"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 font-mono text-[9px] tracking-[.24em] text-quat">MÉTRICA</span>
          {(["taxa", "valor"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetrica(m)}
              aria-pressed={metrica === m}
              className={`border px-2.5 py-1.5 font-mono text-[9.5px] tracking-[.1em] hover:border-edgehover hover:text-ink ${
                metrica === m ? "border-ink bg-[rgba(236,234,228,.1)] text-ink" : "border-edge text-ter"
              }`}
            >
              {m === "taxa" ? "TAXA / 100 MIL" : "N.º ABSOLUTO"}
            </button>
          ))}
        </div>
      </div>

      {/* aviso metodológico — a distorção mais séria deste mapa */}
      <div className="flex items-start gap-2 border-b border-line bg-[rgba(226,163,59,.05)] px-7 py-2.5">
        <span className="mt-[3px] h-[7px] w-[7px] flex-none rotate-45 border border-indicio" />
        <p className="text-[12.5px] leading-[1.55] text-indiciotx">
          <strong className="text-indicio">A taxa por residente engana em dois casos.</strong> Concelhos{" "}
          <strong>turísticos</strong> (Albufeira, Vila do Bispo) contam crime cometido sobre milhares de visitantes,
          mas dividem por quem lá mora. Concelhos <strong>muito pequenos</strong> saltam no ranking com meia dúzia de
          ocorrências. Por isso o ranking filtra por dimensão — e o mapa mostra toda a gente.
        </p>
      </div>

      {/* mapa + painel */}
      <div className="grid grid-cols-1 border-b border-line lg:grid-cols-[minmax(0,1fr)_396px]">
        <div className="relative min-h-[520px] lg:h-[calc(100vh-260px)] lg:min-h-[620px]">
          <ConcelhosMap
            linhas={linhas}
            cortes={cortes}
            selecionado={selecionado}
            onSelect={(d) => setSelecionado((cur) => (cur === d ? null : d))}
            metrica={metrica}
            vista={vista}
          />
          {/* legenda */}
          <div className="pointer-events-none absolute bottom-6 left-6 z-10 border border-edge bg-[rgba(12,13,16,.9)] p-3 backdrop-blur">
            <p className="font-mono text-[9px] tracking-[.2em] text-quat">
              {metrica === "taxa" ? "TAXA / 100 MIL HAB." : "CRIMES REGISTADOS"} · {ano}
            </p>
            <div className="mt-2 flex">
              {RAMPA.map((cor) => (
                <span key={cor} className="h-2 w-11" style={{ background: cor }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-quat" style={{ width: 220 }}>
              <span>menor</span>
              <span>maior</span>
            </div>
            <p className="mt-1.5 font-mono text-[8.5px] leading-[1.6] tracking-[.06em] text-ghost">
              ESCALA POR QUINTIS DA DISTRIBUIÇÃO REAL
            </p>
          </div>
        </div>

        {/* painel: perfil + ranking */}
        <aside className="flex min-h-[520px] flex-col border-l border-line bg-panel lg:h-[calc(100vh-260px)]">
          <div className="border-b border-line px-5 py-5">
            {sel ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9.5px] tracking-[.22em] text-quat">PERFIL DO CONCELHO</p>
                  <p className="font-mono text-[9.5px] tracking-[.12em] text-sec">
                    {posSel}.º / {ordenadas.length}
                  </p>
                </div>
                <div className="mt-2.5 flex items-baseline gap-3">
                  <h2 className="text-[26px] font-[620] tracking-[-0.01em] [font-stretch:115%]">{sel.nome}</h2>
                  <span className="font-mono text-[11px] text-quat">{sel.distrito}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line">
                  <div className="bg-cell px-3.5 py-3">
                    <p className="font-mono text-[8.5px] tracking-[.18em] text-quat">TAXA / 100 MIL</p>
                    <p className="mt-1 text-[26px] font-[640] [font-stretch:110%]" style={{ color: corPara(sel.taxa, cortes) === "#23272E" ? "#ECEAE4" : corPara(sel.taxa, cortes) }}>
                      {fmtTaxa(sel.taxa)}
                    </p>
                  </div>
                  <div className="bg-cell px-3.5 py-3">
                    <p className="font-mono text-[8.5px] tracking-[.18em] text-quat">CRIMES REGISTADOS</p>
                    <p className="mt-1 text-[26px] font-[640] text-ink [font-stretch:110%]">{fmtInt(sel.valor)}</p>
                  </div>
                  <div className="bg-cell px-3.5 py-3">
                    <p className="font-mono text-[8.5px] tracking-[.18em] text-quat">POPULAÇÃO</p>
                    <p className="mt-1 font-mono text-[17px] font-semibold text-sec">
                      {sel.pop ? fmtInt(sel.pop) : "—"}
                    </p>
                  </div>
                  <div className="bg-cell px-3.5 py-3">
                    <p className="font-mono text-[8.5px] tracking-[.18em] text-quat">VS MÉDIA NACIONAL</p>
                    <p className="mt-1 font-mono text-[17px] font-semibold text-sec">
                      {sel.taxa && taxaNac ? `${(sel.taxa / taxaNac).toFixed(2).replace(".", ",")}×` : "—"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelecionado(null)}
                  className="mt-3 font-mono text-[9px] tracking-[.16em] text-quat underline underline-offset-2 hover:text-sec"
                >
                  ← VER O PAÍS INTEIRO
                </button>
              </>
            ) : (
              <>
                <p className="font-mono text-[9.5px] tracking-[.22em] text-quat">PORTUGAL</p>
                <div className="mt-2.5 flex items-baseline gap-3">
                  <span className="text-[40px] font-[640] leading-none [font-stretch:112%]">{fmtInt(nacional)}</span>
                  <span className="max-w-[170px] text-[12.5px] leading-[1.45] text-ter">
                    {CATEGORIA_CURTA[categoria].toLowerCase()} registada em {ano}
                  </span>
                </div>
                <p className="mt-3 text-[12.5px] leading-[1.6] text-ter">
                  Clique num concelho no mapa ou na lista para abrir o perfil. A escala de cor usa{" "}
                  <span className="text-sec">quintis</span> da distribuição real do ano.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-5 pb-2 pt-3.5">
            <p className="whitespace-nowrap font-mono text-[9.5px] tracking-[.22em] text-quat">
              RANKING — {metrica === "taxa" ? "TAXA / 100 MIL" : "N.º ABSOLUTO"}
            </p>
            <div className="flex flex-none items-center gap-1">
              {([[20000, "≥20 MIL"], [0, "TODOS"]] as const).map(([v, rot]) => (
                <button
                  key={rot}
                  type="button"
                  onClick={() => setPiso(v)}
                  aria-pressed={piso === v}
                  title="Piso populacional: evita que concelhos minúsculos dominem o ranking por ruído estatístico"
                  className={`whitespace-nowrap border px-1.5 py-0.5 font-mono text-[8.5px] leading-[1.5] tracking-[.1em] ${
                    piso === v ? "border-ink text-ink" : "border-edge text-quat hover:text-sec"
                  }`}
                >
                  {rot}
                </button>
              ))}
              <span className="ml-1 font-mono text-[9px] text-ghost">{ordenadas.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {ordenadas.map((l, i) => {
              const v = metrica === "taxa" ? l.taxa : l.valor;
              const max = metrica === "taxa" ? ordenadas[0]?.taxa ?? 1 : ordenadas[0]?.valor ?? 1;
              const act = selecionado === l.dico;
              return (
                <button
                  key={l.dico}
                  type="button"
                  onClick={() => setSelecionado(act ? null : l.dico)}
                  className="flex w-full items-center gap-2.5 px-2 py-1.5 text-left hover:bg-hoverrow"
                  style={{
                    background: act ? "#14171D" : undefined,
                    borderLeft: `2px solid ${act ? "#E5533D" : "transparent"}`,
                  }}
                >
                  <span className="w-6 flex-none font-mono text-[9px] text-quat">{i + 1}</span>
                  <span className="w-[104px] flex-none truncate text-[12px] text-[#C9C7C1]">{l.nome}</span>
                  <span className="relative h-[5px] flex-1 bg-hair">
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{
                        width: `${max ? Math.max(1, ((v ?? 0) / (max as number)) * 100) : 0}%`,
                        background: corPara(v, cortes),
                      }}
                    />
                  </span>
                  <span className="w-11 flex-none text-right font-mono text-[10.5px] text-sec">
                    {metrica === "taxa" ? fmtTaxa(l.taxa) : fmtInt(l.valor)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      <p className="px-7 py-4 font-mono text-[9px] leading-[1.9] tracking-[.08em] text-quat">
        FONTE — {FONTE.toUpperCase()} · POPULAÇÃO RESIDENTE INE · GEOMETRIA CAOP/DGT (CC-BY).{" "}
        <span className="text-indiciodim">
          CRIME REGISTADO MEDE PARTICIPAÇÕES ÀS FORÇAS DE SEGURANÇA — NÃO O CRIME REALMENTE OCORRIDO.
        </span>
      </p>
    </main>
  );
}
