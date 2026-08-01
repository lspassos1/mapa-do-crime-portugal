import crimeAsset from "@/data/crimePt.min.json";
import concelhosAsset from "@/data/concelhos.json";

// Camada de dados do produto. Tudo vem de assets versionados gerados pelo ETL
// (etl/etl_pt.py) a partir do INE/DGPJ e da CAOP — sem chamadas em runtime.

export type CategoriaKey =
  | "total"
  | "violenciaDomestica"
  | "contraPessoas"
  | "contraPatrimonio"
  | "integridadeFisica"
  | "homicidio"
  | "furtoVeiculo"
  | "rouboViaPublica"
  | "conducaoAlcool";

// Formato compacto (ver etl/): as séries são matrizes posicionais
// [índice do ano][índice da categoria] e -1 significa "sem valor" — poupa ~4x
// face a repetir as chaves 308×5×9 vezes.
interface CrimeAsset {
  fonte: string;
  licenca: string;
  unidade: string;
  anos: number[];
  categorias: Record<string, string>;
  ordemCategorias: CategoriaKey[];
  anosPopulacao: string[];
  series: Record<string, number[][]>;
  populacao: Record<string, number[]>;
}

export interface Concelho {
  dico: string;
  nome: string;
  distrito: string;
  nutsII: string;
  nutsIII: string;
  lat: number;
  lng: number;
  slug: string;
}

const asset = crimeAsset as unknown as CrimeAsset;
const concelhos = (concelhosAsset as { concelhos: Concelho[] }).concelhos;

const idxAno = new Map(asset.anos.map((a, i) => [a, i]));
const idxCat = new Map(asset.ordemCategorias.map((c, i) => [c, i]));

/** Valor de um concelho/ano/categoria, ou undefined quando não há registo. */
function valorDe(dico: string, ano: number, categoria: CategoriaKey): number | undefined {
  const ia = idxAno.get(ano);
  const ic = idxCat.get(categoria);
  if (ia === undefined || ic === undefined) return undefined;
  const v = asset.series[dico]?.[ia]?.[ic];
  return v === undefined || v < 0 ? undefined : v;
}

export const FONTE = asset.fonte;
export const UNIDADE = asset.unidade;
export const ANOS = asset.anos;
export const ANO_RECENTE = Math.max(...asset.anos);
export const CATEGORIAS = asset.categorias as Record<CategoriaKey, string>;

// Rótulos curtos para a UI (o rótulo oficial do INE é longo demais p/ chip).
export const CATEGORIA_CURTA: Record<CategoriaKey, string> = {
  total: "Criminalidade geral",
  violenciaDomestica: "Violência doméstica",
  contraPessoas: "Contra as pessoas",
  contraPatrimonio: "Contra o património",
  integridadeFisica: "Integridade física",
  homicidio: "Homicídio consumado",
  furtoVeiculo: "Furto de/em veículo",
  rouboViaPublica: "Roubo na via pública",
  conducaoAlcool: "Condução com álcool",
};

export const CONCELHOS = concelhos;
const porDico = new Map(concelhos.map((c) => [c.dico, c]));
export function getConcelho(dico: string): Concelho | undefined {
  return porDico.get(dico);
}

// População do ano pedido, com recuo para o ano mais recente disponível — o INE
// publica a estimativa de população com atraso face à série de crime.
export function populacao(dico: string, ano: number): { valor: number; anoUsado: number } | null {
  const serie = asset.populacao[dico];
  if (!serie) return null;
  const disponiveis = asset.anosPopulacao
    .map((a, i) => ({ ano: Number(a), valor: serie[i] }))
    .filter((x) => x.valor >= 0)
    .sort((a, b) => b.ano - a.ano);
  if (!disponiveis.length) return null;
  const escolhido = disponiveis.find((x) => x.ano === ano) ?? disponiveis[0];
  return { valor: escolhido.valor, anoUsado: escolhido.ano };
}

export interface LinhaConcelho {
  dico: string;
  nome: string;
  distrito: string;
  lat: number;
  lng: number;
  valor: number; // crimes registados
  taxa: number | null; // por 100 mil habitantes
  pop: number | null;
  popAno: number | null;
}

// Linhas de um ano/categoria, já com taxa por 100 mil — a métrica correta para
// comparar concelhos de dimensão muito diferente (Lisboa × Corvo).
export function linhas(ano: number, categoria: CategoriaKey): LinhaConcelho[] {
  const out: LinhaConcelho[] = [];
  for (const c of concelhos) {
    const valor = valorDe(c.dico, ano, categoria);
    if (valor === undefined) continue;
    const p = populacao(c.dico, ano);
    out.push({
      dico: c.dico,
      nome: c.nome,
      distrito: c.distrito,
      lat: c.lat,
      lng: c.lng,
      valor,
      pop: p?.valor ?? null,
      popAno: p?.anoUsado ?? null,
      taxa: p && p.valor > 0 ? (valor / p.valor) * 1e5 : null,
    });
  }
  return out;
}

// Série anual de um concelho (ou do país inteiro quando dico = null).
export function serie(dico: string | null, categoria: CategoriaKey): { ano: number; valor: number }[] {
  return ANOS.map((ano) => {
    if (dico) return { ano, valor: valorDe(dico, ano, categoria) ?? 0 };
    let soma = 0;
    for (const d of Object.keys(asset.series)) soma += valorDe(d, ano, categoria) ?? 0;
    return { ano, valor: soma };
  });
}

export function totalNacional(ano: number, categoria: CategoriaKey): number {
  let soma = 0;
  for (const d of Object.keys(asset.series)) soma += valorDe(d, ano, categoria) ?? 0;
  return soma;
}

export function populacaoNacional(ano: number): number {
  let soma = 0;
  for (const d of Object.keys(asset.populacao)) {
    const p = populacao(d, ano);
    if (p) soma += p.valor;
  }
  return soma;
}

// Escala de cor: quantis sobre a distribuição real do ano/categoria. Quantis (e
// não corte linear) porque a distribuição é enviesada — poucos concelhos com
// taxa muito alta achatariam todo o resto numa cor só.
export const RAMPA = ["#23272E", "#4B2C2A", "#7A342C", "#B03D2C", "#E5533D"] as const;

export function escalaQuantil(valores: number[]): number[] {
  const v = valores.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return [0, 0, 0, 0];
  const q = (p: number) => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

export function corPara(valor: number | null, cortes: number[]): string {
  if (valor === null || !Number.isFinite(valor)) return "#14171C";
  let i = 0;
  while (i < cortes.length && valor > cortes[i]) i++;
  return RAMPA[Math.min(i, RAMPA.length - 1)];
}

export const fmtInt = (n: number) => n.toLocaleString("pt-PT");
export const fmtTaxa = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
