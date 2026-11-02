import { Users } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { greenPanelClass } from "@/components/payment/payment-styles";
import { formatCompactRupiah } from "@/lib/payment/billing";

type DonationHeroProps = {
  collected: number;
  donorCount: number;
};

export function DonationHero({ collected, donorCount }: DonationHeroProps) {
  return (
    <section className={cn(greenPanelClass, "overflow-hidden")}>
      <div className="grid md:grid-cols-[1fr_220px]">
        <div className="p-6 sm:p-7 md:p-9">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">
            Kantong solidaritas warga
          </p>
          <h1 className="mt-4 text-[1.75rem] font-black leading-tight sm:mt-5 sm:text-3xl md:text-4xl">
            Bantuan dekat,
            <br />
            dampak terasa.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-green-100">
            Donasi dikelola untuk kebutuhan sosial warga: bantuan darurat,
            kesehatan, pangan, dan dukungan bagi kelompok rentan.
          </p>
        </div>

        <dl className="grid grid-cols-2 border-t border-white/10 md:grid-cols-1 md:border-l md:border-t-0">
          <div className="flex flex-col justify-center p-5 md:border-b md:border-white/10">
            <dt className="text-xs text-green-200">Total terkumpul</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums">
              {formatCompactRupiah(collected)}
            </dd>
          </div>
          <div className="flex flex-col justify-center border-l border-white/10 p-5 md:border-l-0">
            <dt className="text-xs text-green-200">Donatur</dt>
            <dd className="mt-1 flex items-center gap-2 text-xl font-bold tabular-nums">
              <Users aria-hidden="true" className="h-4 w-4" />
              {donorCount.toLocaleString("id-ID")}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
