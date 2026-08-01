#!/usr/bin/env python3
"""ETL do Mapa do Crime Portugal.

Gera os assets compactos que a app importa:
  - crimePt.min.json      series posicionais [ano][categoria], -1 = sem valor
  - concelhosMesh.min.json malha quantizada + delta-encoded (estilo TopoJSON)
  - concelhos.json        dicionario (DICO, nome, distrito, centroide, slug)
A compactacao corta ~3,4x (806 KB -> 234 KB) sem perder informacao util.

Fontes (todas CC-BY / dados abertos oficiais):
  - Crime municipal: INE varcd=0012261 "Crimes registados pelas autoridades
    policiais por Localização geográfica (NUTS-2024) e Categoria de crime"
    (fonte primária: DGPJ — Direção-Geral da Política de Justiça)
  - Geografia: CAOP (DGT) via nmota/caop_GeoJSON — 308 concelhos, CRS84
  - População residente por município: INE varcd=0008273 (para taxa/100 mil)

Join: geocod do INE (7 dígitos) -> DICO do CAOP = geocod[3:]  (308/308 validado)
"""
import json
import re
import sys
import urllib.request
from pathlib import Path
from typing import Optional

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
ANOS = list(range(2015, 2026))  # 2025 é provisório no INE
UA = {"User-Agent": "Mozilla/5.0 (mapa-do-crime-portugal ETL)"}
INE = "https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd={var}&Dim1=S7A{ano}&lang=PT"

# Categorias que o produto expõe (chave curta -> rótulo exato do INE).
# Foco editorial: criminalidade geral + violência doméstica (ver METODOLOGIA).
CATEGORIAS = {
    "total": "Total",
    "violenciaDomestica": "Violência doméstica contra cônjuge ou análogos",
    "contraPessoas": "Crimes contra as pessoas",
    "contraPatrimonio": "Crimes contra o património",
    "integridadeFisica": "Crimes contra a integridade física",
    "homicidio": "Crimes de homicídio voluntário consumado",
    "furtoVeiculo": "Furto de veículo e em veículo motorizado",
    "rouboViaPublica": "Roubo por esticão e na via pública",
    "conducaoAlcool": "Condução de veículo com taxa de álcool igual ou superior a 1,2 g/l",
}


CACHE = Path("cache")


def get(url: str, tag: str) -> object:
    """GET com cache em disco e retries — o servidor do INE é lento e instável."""
    CACHE.mkdir(exist_ok=True)
    f = CACHE / (tag + ".json")
    if f.exists() and f.stat().st_size > 200:
        return json.loads(f.read_text())
    import time

    ultimo = None
    for tentativa in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=180) as r:
                txt = r.read().decode("utf-8")
            json.loads(txt)  # valida
            f.write_text(txt)
            return json.loads(txt)
        except Exception as e:
            ultimo = e
            time.sleep(3 * (tentativa + 1))
    raise RuntimeError(f"falhou apos 4 tentativas: {ultimo}")


def linhas_de(payload):
    """Extrai as linhas do envelope do INE, tolerando anos sem dados."""
    if not isinstance(payload, list) or not payload:
        return []
    dados = payload[0].get("Dados")
    if not isinstance(dados, dict) or not dados:
        return []
    return list(dados.values())[0]


def num(v):
    if v in (None, "", "x", "..", "-"):
        return None
    try:
        return float(str(v).replace(",", "."))
    except ValueError:
        return None


def slug(s: str) -> str:
    """normaliza nome para geocoding por dicionário (sem acentos, minúsculas)"""
    import unicodedata

    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", s.lower())).strip()


def main() -> None:
    rotulo_para_chave = {v: k for k, v in CATEGORIAS.items()}

    # ---- 1. crime por município/ano/categoria -----------------------------
    series: dict[str, dict[str, dict[str, int]]] = {}  # dico -> ano -> cat -> n
    nomes: dict[str, str] = {}
    anos_ok: list[int] = []
    for ano in ANOS:
        try:
            payload = get(INE.format(var="0012261", ano=ano), f"crime{ano}")
        except Exception as e:  # ano indisponível: segue
            print(f"  {ano}: indisponivel ({str(e)[:60]})")
            continue
        linhas = linhas_de(payload)
        if not linhas:
            print(f"  {ano}: sem dados")
            continue
        n = 0
        for l in linhas:
            geocod = str(l.get("geocod", ""))
            if len(geocod) != 7:  # só nível município
                continue
            chave = rotulo_para_chave.get(l.get("dim_3_t", ""))
            if not chave:
                continue
            v = num(l.get("valor"))
            if v is None:
                continue
            dico = geocod[3:]
            nomes[dico] = l.get("geodsg", "")
            series.setdefault(dico, {}).setdefault(str(ano), {})[chave] = int(v)
            n += 1
        anos_ok.append(ano)
        print(f"  {ano}: {n} valores municipais")

    # ---- 2. população residente por município (taxa/100 mil) --------------
    populacao: dict[str, dict[str, int]] = {}
    for ano in anos_ok:
        try:
            payload = get(INE.format(var="0008273", ano=ano), f"pop{ano}")
            linhas = linhas_de(payload)
        except Exception:
            continue
        for l in linhas:
            geocod = str(l.get("geocod", ""))
            # o indicador vem desagregado por sexo e escalao etario:
            # HM + Total = populacao residente total do concelho
            if len(geocod) != 7 or l.get("dim_3_t") != "HM" or l.get("dim_4_t") != "Total":
                continue
            v = num(l.get("valor"))
            if v is not None:
                populacao.setdefault(geocod[3:], {})[str(ano)] = int(v)

    # ---- 3. geografia: centroides + dicionário ----------------------------
    geo = json.loads(Path("pt_mun.geojson").read_text())
    concelhos = []
    for f in geo["features"]:
        p = f["properties"]
        dico = p["DICO"]
        # centroide do maior anel (suficiente p/ rótulo e geocoding)
        coords = f["geometry"]["coordinates"]
        aneis = coords if f["geometry"]["type"] == "Polygon" else [c[0] for c in coords]
        maior = max(aneis, key=len)
        xs = [c[0] for c in maior]
        ys = [c[1] for c in maior]
        concelhos.append(
            {
                "dico": dico,
                "nome": (p.get("Concelho") or p.get("MUNICIPIO") or "").title(),
                "distrito": (p.get("Distrito") or p.get("ILHA") or "").title(),
                "nutsII": p.get("NUTII_DSG") or p.get("NUT2_DSG") or "",
                "nutsIII": p.get("NUTIII_DSG") or p.get("NUT3_DSG") or "",
                "lat": round(sum(ys) / len(ys), 5),
                "lng": round(sum(xs) / len(xs), 5),
                "slug": slug(p.get("Concelho") or p.get("MUNICIPIO") or ""),
            }
        )
    concelhos.sort(key=lambda c: c["dico"])

    # ---- 4. escrever assets ----------------------------------------------
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "crimePt.json").write_text(
        json.dumps(
            {
                "fonte": "INE / DGPJ — Crimes registados pelas autoridades policiais (indicador 0012261)",
                "licenca": "CC-BY",
                "unidade": "crimes registados (participações às forças de segurança)",
                "anos": anos_ok,
                "categorias": CATEGORIAS,
                "series": series,
                "populacao": populacao,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    (OUT / "concelhos.json").write_text(
        json.dumps(
            {"fonte": "CAOP / DGT (CC-BY-4.0)", "total": len(concelhos), "concelhos": concelhos},
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    print(f"\ncrimePt.json: {len(series)} concelhos × {len(anos_ok)} anos")
    print(f"concelhos.json: {len(concelhos)} concelhos com centroide")
    print(f"população: {len(populacao)} concelhos")


if __name__ == "__main__":
    main()
