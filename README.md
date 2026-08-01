# 🇵🇹 Mapa do Crime Portugal

> Criminalidade **registada** pelas forças de segurança, concelho a concelho — com a lente principal na **violência doméstica**. Dados oficiais INE/DGPJ.

**Regra editorial inegociável:** *crime registado ≠ crime ocorrido.* Tudo aqui mede **participações à PSP/GNR**. Entre o crime que acontece e o que é registado há a **cifra negra** — e ela não é igual para todos os crimes nem para todos os sítios.

## Porque não é uma tradução do [Mapa da Violência Brasil](https://github.com/lspassos1/mapa-da-violencia-brasil)

Portugal registou **98 homicídios em 2025** — ~0,9 por 100 mil, contra ~23 no Brasil. Distribuídos por 308 concelhos, um mapa coroplético de homicídio ficaria **quase todo vazio**. Traduzir o produto brasileiro à letra produziria um mapa sem sinal e alarmista.

Por isso o produto **mudou de natureza**: mede **criminalidade geral** (~339 mil registos/ano) e destaca a **violência doméstica** (~25 mil participações/ano) — o problema real, documentado e com maior cifra negra do país.

| | Brasil | Portugal |
|---|---|---|
| Camada ao vivo | Fogo Cruzado (tiroteios) | **não existe** equivalente |
| Unidade oficial | homicídio doloso (vítimas) | crimes registados (participações) |
| Geografia | 5.564 municípios / 27 UF | **308 concelhos** / 18 distritos + 2 R.A. |
| Tensão central | indício ≠ estatística oficial | **registado ≠ ocorrido** |

## Dados

| Fonte | Uso | Licença |
|---|---|---|
| **INE / DGPJ** (indicador `0012261`) | Crimes registados por concelho e categoria, 2021–2025 | CC-BY |
| **INE** | População residente por concelho (denominador da taxa) | CC-BY |
| **CAOP / DGT** | Geometria dos 308 concelhos | CC-BY-4.0 |
| **RASI** | Validação dos totais nacionais | — |

Regeneração: `python3 etl/etl_pt.py src/data` (com cache em disco — o servidor do INE é lento).

## Distorções conhecidas (ver `/metodologia`)

- **Turismo infla a taxa** — Albufeira lidera porque o crime ocorre sobre visitantes mas divide por residentes.
- **Concelhos pequenos oscilam** — por isso o ranking traz piso de 20 mil habitantes; o mapa mostra todos.
- **Violência doméstica: subnotificação estrutural** — uma subida pode ser mais denúncia, não mais violência.
- **Homicídio é raro demais para mapear** por concelho.

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · MapLibre GL · design *instrumento de inteligência* (Archivo `wdth` 62–125 + IBM Plex Mono, zero border-radius, cor estritamente semântica).

```bash
npm install && npm run dev
```

**Emergência: 112 · Violência doméstica: 800 202 148 (gratuita, 24h)**

AGPL-3.0

## Assets compactos

Os dados que a app importa são gerados em formato compacto pelo ETL:

| Asset | Formato | Tamanho |
|---|---|---|
| `concelhosMesh.min.json` | malha quantizada + delta-encoded (estilo TopoJSON) | 175 KB *(de 546 KB)* |
| `crimePt.min.json` | séries posicionais `[ano][categoria]`, `-1` = sem valor | 58 KB *(de 259 KB)* |
| `concelhos.json` | dicionário: DICO, nome, distrito, centroide, slug | 52 KB |

**3,4× menor** no total, sem perder informação útil — a descodificação acontece uma vez no arranque. Os testes reidratam os formatos e validam o **conteúdo**, não a representação.
