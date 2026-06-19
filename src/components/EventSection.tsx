// Bold section heading: teal accent bar + large title, content always shown.
// (Used as tab panels on the event page — no collapse control.)
export default function EventSection({ id, title, children }: { id?: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-7 rounded-full bg-teal-500 shrink-0" aria-hidden="true" />
        <h2 className="flex-1 text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">{title}</h2>
      </div>
      <div className="pt-4 sm:pl-[18px]">{children}</div>
    </section>
  )
}
