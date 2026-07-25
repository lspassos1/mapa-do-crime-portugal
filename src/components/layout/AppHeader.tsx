"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderClock } from "@/components/layout/HeaderClock";
import { FidelityRibbon } from "@/components/layout/FidelityRibbon";

interface NavItem {
  href: string;
  label: string;
  title?: string;
}

const NAV: NavItem[] = [
  { href: "/", label: "O MAPA", title: "Criminalidade registada por concelho" },
  { href: "/violencia-domestica", label: "VIOLÊNCIA DOMÉSTICA", title: "A lente principal do produto" },
  { href: "/metodologia", label: "METODOLOGIA", title: "Fontes, limites e a moldura editorial" },
];

const REPO = "https://github.com/lspassos1/mapa-do-crime-portugal";

function bestMatch(pathname: string): string | null {
  let best: string | null = null;
  for (const { href } of NAV) {
    if (pathname === href || (href !== "/" && pathname.startsWith(href + "/"))) {
      if (!best || href.length > best.length) best = href;
    }
  }
  return best ?? (pathname === "/" ? "/" : null);
}

// Marca: mira sobre a silhueta vertical de Portugal continental.
function BrandMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="9.5" stroke="#3A4048" strokeWidth="1.2" />
      <circle cx="13" cy="13" r="4.5" stroke="#6C717A" strokeWidth="1" />
      <line x1="13" y1="0.5" x2="13" y2="6" stroke="#6C717A" strokeWidth="1.2" />
      <line x1="13" y1="20" x2="13" y2="25.5" stroke="#6C717A" strokeWidth="1.2" />
      <line x1="0.5" y1="13" x2="6" y2="13" stroke="#6C717A" strokeWidth="1.2" />
      <line x1="20" y1="13" x2="25.5" y2="13" stroke="#6C717A" strokeWidth="1.2" />
      <circle cx="13" cy="13" r="2" fill="#E5484D" />
    </svg>
  );
}

export function AppHeader() {
  const pathname = usePathname() ?? "/";
  const active = bestMatch(pathname);
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      <header className="flex h-[58px] items-stretch border-b border-line bg-[rgba(10,11,13,.94)] backdrop-blur-[14px]">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 border-r border-line px-5"
          aria-label="Mapa do Crime Portugal — início"
        >
          <BrandMark />
          <span className="leading-[1.15]">
            <span className="block text-[12.5px] font-bold tracking-[.13em] text-ink [font-stretch:122%]">
              MAPA DO CRIME
            </span>
            <span className="mt-0.5 block font-mono text-[9px] tracking-[.3em] text-[#6C717A]">
              PORTUGAL — 308 CONCELHOS
            </span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-stretch lg:flex" aria-label="Navegação principal">
          {NAV.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center border-r border-hair px-[18px] font-mono text-[10.5px] tracking-[.18em] hover:bg-cellhead hover:text-ink ${
                  isActive ? "text-ink" : "text-sec"
                }`}
              >
                {item.label}
                {isActive ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" aria-hidden="true" /> : null}
              </Link>
            );
          })}
          <span className="flex-1" />
        </nav>

        <div className="ml-auto flex items-center gap-[18px] border-l border-line px-5 lg:ml-0">
          <HeaderClock />
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Código-fonte no GitHub (AGPL-3.0)"
            title="Código-fonte (AGPL-3.0)"
            className="hidden h-[30px] w-[30px] items-center justify-center border border-edge font-mono text-[10px] text-sec hover:border-edgehover hover:text-ink sm:flex"
          >
            &lt;/&gt;
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-[30px] w-[30px] items-center justify-center border border-edge font-mono text-[12px] text-sec hover:border-edgehover hover:text-ink lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? "✕" : "≡"}
          </button>
        </div>
      </header>

      {open ? (
        <nav id="mobile-nav" className="border-b border-line bg-panel lg:hidden" aria-label="Navegação principal (móvel)">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active === item.href ? "page" : undefined}
              className={`block border-b border-hair px-5 py-3.5 font-mono text-[11px] tracking-[.16em] last:border-b-0 ${
                active === item.href ? "bg-cellhead text-ink" : "text-sec"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <FidelityRibbon />
    </div>
  );
}
