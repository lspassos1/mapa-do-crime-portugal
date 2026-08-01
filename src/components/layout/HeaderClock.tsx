"use client";

import { useEffect, useState } from "react";

// Relógio do header ISOLADO em componente próprio: o tick de 1s re-renderiza
// SÓ este bloco, nunca a árvore do header/página. Começa com placeholder no SSR
// e só mostra a hora após montar (evita mismatch de hidratação). A hora é
// sempre a de Lisboa — o produto é sobre Portugal, não sobre quem o consulta.
const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const p2 = (n: number) => String(n).padStart(2, "0");

const LISBOA = "Europe/Lisbon";

/** Partes da data já convertidas para o fuso de Lisboa. */
function emLisboa(d: Date) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: LISBOA,
    weekday: "short",
    day: "2-digit",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).formatToParts(d);
  const g = (t: string) => f.find((x) => x.type === t)?.value ?? "";
  return {
    dia: Number(g("day")),
    mes: Number(g("month")),
    ano: g("year"),
    h: g("hour"),
    m: g("minute"),
    s: g("second"),
    diaSemana: g("weekday").toUpperCase(),
    tz: g("timeZoneName"), // WET / WEST conforme a estação
  };
}

const SEMANA: Record<string, string> = { SUN: "DOM", MON: "SEG", TUE: "TER", WED: "QUA", THU: "QUI", FRI: "SEX", SAT: "SÁB" };

function fmtRelogio(d: Date): string {
  const t = emLisboa(d);
  const ds = SEMANA[t.diaSemana.slice(0, 3)] ?? DIAS[d.getDay()];
  return `${ds} ${p2(t.dia)} ${MESES[t.mes - 1]} ${t.ano} · ${t.h}:${t.m}:${t.s} ${t.tz}`;
}

// Ano de referência da série exibida (o dado do INE é anual, não há "janela viva").
function fmtJanela(d: Date): string {
  const t = emLisboa(d);
  return `LISBOA · ${t.ano}`;
}

export function HeaderClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // primeiro tick assíncrono (regra set-state-in-effect) + tick de 1s
    const t = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  return (
    <div aria-hidden="true" className="hidden text-right leading-[1.4] md:block" suppressHydrationWarning>
      <div className="font-mono text-[10px] tracking-[.12em] text-sec tabular-nums">
        {now ? fmtRelogio(now) : "— · --:--:-- BRT"}
      </div>
      <div className="font-mono text-[9px] tracking-[.14em] text-quat">
        JANELA {now ? fmtJanela(now) : "—"}
      </div>
    </div>
  );
}
