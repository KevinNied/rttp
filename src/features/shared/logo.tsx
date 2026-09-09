import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/rttp-mark-v2.png"
        alt=""
        width={36}
        height={36}
        unoptimized
        className="size-9 rounded-lg bg-indigo-950 p-1 object-contain drop-shadow-[0_0_14px_rgba(99,102,241,.2)] dark:bg-transparent dark:p-0"
      />
      <div>
        <div className="text-sm font-semibold tracking-[0.24em] text-white">
          RTTP
        </div>
        <div className="text-[9px] uppercase tracking-[0.18em] text-indigo-200/40">
          Return To The Prime
        </div>
      </div>
    </div>
  );
}
