import assert from "node:assert/strict";
import test from "node:test";

import crime from "../src/data/crimePt.json" with { type: "json" };
import concelhosAsset from "../src/data/concelhos.json" with { type: "json" };
import mesh from "../src/data/concelhosMesh.json" with { type: "json" };

// Invariantes dos assets gerados pelo ETL. Se o INE mudar o indicador, a CAOP
// mudar a malha, ou alguém regenerar com um filtro errado, estes testes falham
// ANTES de o mapa mentir em produção.

const concelhos = concelhosAsset.concelhos;

test("cobertura: 308 concelhos em todos os assets, com os mesmos códigos", () => {
  assert.equal(concelhos.length, 308, "CAOP tem 308 concelhos");
  assert.equal(mesh.features.length, 308, "a malha simplificada mantém os 308");

  const dicosDir = new Set(concelhos.map((c) => c.dico));
  const dicosMesh = new Set(mesh.features.map((f) => f.properties.dico));
  const dicosCrime = new Set(Object.keys(crime.series));

  assert.equal(dicosDir.size, 308);
  assert.deepEqual([...dicosMesh].filter((d) => !dicosDir.has(d)), [], "malha sem código órfão");
  assert.deepEqual([...dicosCrime].filter((d) => !dicosDir.has(d)), [], "crime sem código órfão");
  assert.equal(dicosCrime.size, 308, "todos os concelhos têm série de crime");
});

test("geografia: centroides dentro do território português", () => {
  for (const c of concelhos) {
    // continente + Madeira + Açores: lng -31.3..-6.1, lat 32.4..39.8 (Corvo no topo)
    assert.ok(c.lng >= -31.5 && c.lng <= -6.0, `${c.nome}: lng fora de Portugal (${c.lng})`);
    assert.ok(c.lat >= 32.3 && c.lat <= 42.3, `${c.nome}: lat fora de Portugal (${c.lat})`);
    assert.ok(c.nome.length > 1 && c.distrito.length > 1, `${c.dico}: nome/distrito em falta`);
  }
});

test("geometria: anéis fechados e com vértices suficientes", () => {
  for (const f of mesh.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      for (const anel of poly) {
        assert.ok(anel.length >= 4, `${f.properties.nome}: anel com ${anel.length} pontos`);
        assert.deepEqual(anel[0], anel[anel.length - 1], `${f.properties.nome}: anel não fechado`);
      }
    }
  }
});

test("crime: totais nacionais na ordem de grandeza do RASI", () => {
  for (const ano of crime.anos) {
    let total = 0;
    let vd = 0;
    for (const serie of Object.values(crime.series)) {
      total += serie[String(ano)]?.total ?? 0;
      vd += serie[String(ano)]?.violenciaDomestica ?? 0;
    }
    // RASI: criminalidade geral ~280-360 mil/ano; violência doméstica ~20-30 mil
    assert.ok(total > 250_000 && total < 400_000, `${ano}: total nacional improvável (${total})`);
    assert.ok(vd > 15_000 && vd < 35_000, `${ano}: violência doméstica improvável (${vd})`);
    // a categoria nunca pode exceder o total
    assert.ok(vd < total, `${ano}: violência doméstica > total`);
  }
});

test("crime: nenhum valor negativo e categorias conhecidas", () => {
  const validas = new Set(Object.keys(crime.categorias));
  for (const [dico, anos] of Object.entries(crime.series)) {
    for (const [ano, cats] of Object.entries(anos)) {
      for (const [k, v] of Object.entries(cats)) {
        assert.ok(validas.has(k), `${dico}/${ano}: categoria desconhecida "${k}"`);
        assert.ok(Number.isInteger(v) && v >= 0, `${dico}/${ano}/${k}: valor inválido (${v})`);
      }
    }
  }
});

test("população: plausível e suficiente para calcular taxas", () => {
  const anos = crime.anos.map(String);
  let totalPais = 0;
  const anoBase = Object.keys(Object.values(crime.populacao)[0])[0];
  for (const [dico, serie] of Object.entries(crime.populacao)) {
    const v = serie[anoBase];
    assert.ok(v > 0, `${dico}: população não positiva`);
    // Corvo (~400) é o mínimo real; Lisboa (~545k) o máximo
    assert.ok(v >= 300 && v <= 700_000, `${dico}: população improvável (${v})`);
    totalPais += v;
  }
  assert.ok(totalPais > 10_000_000 && totalPais < 11_500_000, `população do país improvável (${totalPais})`);
  assert.equal(Object.keys(crime.populacao).length, 308);
  assert.ok(anos.length >= 3, "série com pelo menos 3 anos");
});

test("taxas: a distorção conhecida existe e é grande (justifica o piso do ranking)", () => {
  // Este teste documenta a razão do piso de 20 mil habitantes: sem ele, o topo
  // do ranking é dominado por concelhos minúsculos. Se algum dia deixar de ser
  // verdade, o aviso na UI deve ser revisto.
  const anoBase = Object.keys(Object.values(crime.populacao)[0])[0];
  const ano = String(crime.anos[crime.anos.length - 1]);
  const taxas = [];
  for (const c of concelhos) {
    const total = crime.series[c.dico]?.[ano]?.total;
    const pop = crime.populacao[c.dico]?.[anoBase];
    if (total && pop) taxas.push({ nome: c.nome, pop, taxa: (total / pop) * 1e5 });
  }
  taxas.sort((a, b) => b.taxa - a.taxa);
  const top10 = taxas.slice(0, 10);
  const pequenosNoTopo = top10.filter((t) => t.pop < 20_000).length;
  assert.ok(pequenosNoTopo > 0, "sem concelhos pequenos no topo, o piso do ranking perde a razão de ser");
  assert.ok(taxas[0].taxa > taxas[taxas.length - 1].taxa * 3, "dispersão de taxas menor do que o esperado");
});
