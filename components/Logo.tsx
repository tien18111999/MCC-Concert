export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 ring-1 ring-white/15">
        <span className="h-4 w-4 rotate-45 bg-[#ff2d95] shadow-[0_0_18px_rgba(255,45,149,0.9)]" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.7rem] text-white">MCC</span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-fuchsia-200/80">
          Turn It Up
        </span>
      </span>
    </a>
  );
}
