// Garante que os assets de dados existem antes do build.
//
// Eles são versionados no repositório, por isso localmente isto é um no-op.
// Serve para builds a partir de uma cópia sem os assets (ex.: deploy por
// upload de ficheiros): baixa-os do repositório público.
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const RAW = "https://raw.githubusercontent.com/lspassos1/mapa-do-crime-portugal/main/src/data";
const DESTINO = join(process.cwd(), "src", "data");
const ASSETS = ["concelhos.json", "crimePt.min.json", "concelhosMesh.min.json"];

async function existe(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

let baixados = 0;
for (const nome of ASSETS) {
  const alvo = join(DESTINO, nome);
  if (await existe(alvo)) continue;
  const url = `${RAW}/${nome}`;
  const res = await fetch(url);
  if (!res.ok) {
    // falha ruidosa: melhor não construir do que publicar um mapa vazio
    throw new Error(`não foi possível obter ${nome} (HTTP ${res.status}) de ${url}`);
  }
  const txt = await res.text();
  JSON.parse(txt); // valida antes de escrever
  await mkdir(dirname(alvo), { recursive: true });
  await writeFile(alvo, txt);
  console.log(`  ↓ ${nome} (${Math.round(txt.length / 1024)} KB)`);
  baixados++;
}

console.log(baixados ? `dados: ${baixados} asset(s) obtidos do repositório` : "dados: já presentes localmente");
