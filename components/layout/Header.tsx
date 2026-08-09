export function Header() {
  return (
    <div className="flex h-full items-center justify-between px-5 md:px-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
          BravHAS
        </p>

        <h1 className="mt-0.5 text-base font-bold text-[#0B2947]">
          Centro de Controle
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-[#0F172A]">
            Head Administrativo
          </p>

          <p className="text-[11px] text-[#94A3B8]">
            Visão executiva
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3FB] text-xs font-bold text-[#154B7A]">
          HA
        </div>
      </div>
    </div>
  );
}