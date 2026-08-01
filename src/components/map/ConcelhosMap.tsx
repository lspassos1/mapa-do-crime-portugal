"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import meshMin from "@/data/concelhosMesh.min.json";
import { mapTileAttribution, mapTileUrls } from "@/lib/mapConfig";
import { corPara, fmtInt, fmtTaxa, type LinhaConcelho } from "@/lib/crime";

// Enquadramento de Portugal: continente + arquipélagos ficam longe demais para
// um único enquadramento útil, por isso o mapa abre no continente e os Açores/
// Madeira são alcançáveis por zoom-out (ou pelos atalhos do painel).
// A malha vem quantizada e delta-encoded (ver etl/): descodifica-se uma vez
// para GeoJSON no arranque. 175 KB no bundle em vez de 546 KB.
interface MeshMin {
  transform: { scale: [number, number]; translate: [number, number] };
  concelhos: { d: string; n: string; t: string; g: number[][][] }[];
}

function descodificarMalha(): GeoJSON.FeatureCollection {
  const m = meshMin as unknown as MeshMin;
  const [sx, sy] = m.transform.scale;
  const [tx, ty] = m.transform.translate;
  const features = m.concelhos.map((c) => {
    const polys = c.g.map((poly) =>
      poly.map((plano) => {
        const anel: [number, number][] = [];
        let x = 0;
        let y = 0;
        for (let i = 0; i < plano.length; i += 2) {
          x += plano[i];
          y += plano[i + 1];
          anel.push([x * sx + tx, y * sy + ty]);
        }
        return anel;
      }),
    );
    return {
      type: "Feature" as const,
      properties: { dico: c.d, nome: c.n, distrito: c.t },
      geometry:
        polys.length === 1
          ? { type: "Polygon" as const, coordinates: polys[0] }
          : { type: "MultiPolygon" as const, coordinates: polys },
    };
  });
  return { type: "FeatureCollection", features };
}

const mesh = descodificarMalha();

export const VISTAS = {
  continente: { center: [-8.2, 39.7] as [number, number], zoom: 6.35 },
  madeira: { center: [-16.95, 32.75] as [number, number], zoom: 8.6 },
  acores: { center: [-27.9, 38.5] as [number, number], zoom: 6.6 },
} as const;

export function ConcelhosMap({
  linhas,
  cortes,
  selecionado,
  onSelect,
  metrica,
  vista,
}: {
  linhas: LinhaConcelho[];
  cortes: number[];
  selecionado: string | null;
  onSelect: (dico: string | null) => void;
  metrica: "taxa" | "valor";
  vista?: keyof typeof VISTAS;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const prontoRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; linha: LinhaConcelho } | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // índice dico -> linha, para pintar e para o tooltip
  const porDico = new Map(linhas.map((l) => [l.dico, l]));
  const chaveCor = linhas.map((l) => `${l.dico}:${metrica === "taxa" ? l.taxa : l.valor}`).join(",");

  useEffect(() => {
    let descartado = false;
    (async () => {
      if (!containerRef.current || mapRef.current) return;
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (descartado || !containerRef.current) return;
        const map = new maplibregl.Map({
          container: containerRef.current,
          center: VISTAS.continente.center,
          zoom: VISTAS.continente.zoom,
          minZoom: 4,
          maxZoom: 11,
          attributionControl: false,
          style: {
            version: 8,
            sources: {
              base: { type: "raster", tiles: mapTileUrls, tileSize: 256, attribution: mapTileAttribution },
            },
            layers: [
              { id: "bg", type: "background", paint: { "background-color": "#0B0C0F" } },
              { id: "base", type: "raster", source: "base", paint: { "raster-opacity": 0.5 } },
            ],
          },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "bottom-right");
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

        map.on("load", () => {
          if (descartado) return;
          map.addSource("concelhos", { type: "geojson", data: mesh as never, promoteId: "dico" });
          map.addLayer({
            id: "concelhos-fill",
            type: "fill",
            source: "concelhos",
            paint: { "fill-color": "#14171C", "fill-opacity": 0.85 },
          });
          map.addLayer({
            id: "concelhos-line",
            type: "line",
            source: "concelhos",
            paint: { "line-color": "#0A0B0D", "line-width": 0.5, "line-opacity": 0.8 },
          });
          map.addLayer({
            id: "concelho-sel",
            type: "line",
            source: "concelhos",
            filter: ["==", ["get", "dico"], ""],
            paint: { "line-color": "#ECEAE4", "line-width": 1.6 },
          });

          map.on("mousemove", "concelhos-fill", (e) => {
            map.getCanvas().style.cursor = "pointer";
            const dico = e.features?.[0]?.properties?.dico as string | undefined;
            const l = dico ? porDicoRef.current.get(dico) : undefined;
            setTooltip(l ? { x: e.point.x, y: e.point.y, linha: l } : null);
          });
          map.on("mouseleave", "concelhos-fill", () => {
            map.getCanvas().style.cursor = "";
            setTooltip(null);
          });
          map.on("click", "concelhos-fill", (e) => {
            const dico = e.features?.[0]?.properties?.dico as string | undefined;
            if (dico) onSelectRef.current(dico);
          });

          map.resize();
          prontoRef.current = true;
          pintar();
        });
      } catch {
        setErro(true);
      }
    })();
    return () => {
      descartado = true;
      prontoRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refs vivos para os handlers do mapa (registados uma só vez no 'load')
  const porDicoRef = useRef(porDico);
  useEffect(() => {
    porDicoRef.current = porDico;
  });

  function pintar() {
    const map = mapRef.current;
    if (!map || !prontoRef.current) return;
    // expressão 'match' por dico: pinta cada concelho com a cor do seu quantil
    const ramos: (string | string[])[] = [];
    for (const l of linhas) {
      const v = metrica === "taxa" ? l.taxa : l.valor;
      ramos.push(l.dico, corPara(v, cortes));
    }
    if (!ramos.length) return;
    map.setPaintProperty("concelhos-fill", "fill-color", [
      "match",
      ["get", "dico"],
      ...ramos,
      "#14171C",
    ] as never);
  }

  useEffect(pintar, [chaveCor, cortes, metrica]); // eslint-disable-line react-hooks/exhaustive-deps

  // atalhos de vista (continente / Madeira / Açores)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !prontoRef.current || !vista) return;
    map.easeTo({ center: VISTAS[vista].center, zoom: VISTAS[vista].zoom, duration: 700 });
  }, [vista]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !prontoRef.current) return;
    map.setFilter("concelho-sel", ["==", ["get", "dico"], selecionado ?? ""]);
    const src = map.getSource("concelhos") as GeoJSONSource | undefined;
    if (src && selecionado) {
      const l = porDico.get(selecionado);
      if (l) map.easeTo({ center: [l.lng, l.lat], zoom: Math.max(map.getZoom(), 8.5), duration: 700 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado]);

  return (
    <div className="panel-grid relative h-full w-full bg-maparea">
      <div ref={containerRef} className="h-full w-full" role="img" aria-label="Mapa de criminalidade registada por concelho" />
      {erro ? (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-[.14em] text-quat">
          MAPA INDISPONÍVEL — A TABELA CONTINUA A FUNCIONAR
        </p>
      ) : null}
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-20 w-[230px] border border-[#2A2F37] border-t-2 border-t-oficial5 bg-[rgba(12,13,16,.96)] p-3 backdrop-blur-[6px]"
          style={{ left: Math.min(tooltip.x + 14, 640), top: tooltip.y + 14 }}
        >
          <p className="font-mono text-[9px] tracking-[.2em] text-quat">■ REGISTADO — {tooltip.linha.distrito.toUpperCase()}</p>
          <p className="mt-1 text-[13.5px] font-semibold text-ink">{tooltip.linha.nome}</p>
          <p className="mt-1.5 font-mono text-[10px] leading-[1.6] text-sec">
            {fmtTaxa(tooltip.linha.taxa)} / 100 mil hab.
            <br />
            <span className="text-ter">{fmtInt(tooltip.linha.valor)} crimes registados</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
