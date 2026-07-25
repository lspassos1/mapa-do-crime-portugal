// Faixa de fidelidade (34px) sob o header. No produto português a tensão central
// não é "indício × oficial" (como no Brasil) mas **crime REGISTADO × crime
// OCORRIDO**: tudo aqui é participação às forças de segurança, e a diferença
// para o crime real (a "cifra negra") é o problema metodológico do domínio.
export function FidelityRibbon() {
  return (
    <div className="flex h-[34px] items-center overflow-x-auto whitespace-nowrap border-b border-hair bg-panel font-mono text-[9.5px] tracking-[.1em] text-[#6C717A]">
      <div className="flex h-full flex-none items-center gap-2 border-r border-hair px-5">
        <span className="h-[7px] w-[7px] flex-none bg-quat" />
        <span>
          <span className="text-sec">REGISTADO</span> — INE/DGPJ · PARTICIPAÇÕES À PSP/GNR · CONCELHO
        </span>
      </div>
      <div className="flex h-full flex-none items-center gap-2 border-r border-hair px-5">
        <span className="h-[7px] w-[7px] flex-none rotate-45 border border-indicio" />
        <span>
          <span className="text-sec">CIFRA NEGRA</span> — O QUE NÃO É DENUNCIADO NÃO ENTRA NO MAPA
        </span>
      </div>
      <div className="flex h-full flex-none items-center gap-2 border-r border-hair px-5">
        <span className="h-[7px] w-[7px] flex-none rounded-full bg-registro" />
        <span>
          <span className="text-sec">VIOLÊNCIA DOMÉSTICA</span> — LINHA 800 202 148 · EMERGÊNCIA 112
        </span>
      </div>
      <div className="ml-auto flex-none px-5 text-quat">CRIME REGISTADO ≠ CRIME OCORRIDO</div>
    </div>
  );
}
