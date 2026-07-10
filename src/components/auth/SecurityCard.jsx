import { ShieldCheck } from "lucide-react";

export default function SecurityCard() {
  return (
    <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="flex gap-3 items-start">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />

        <div>
          <p className="font-semibold">Your data is safe</p>
          <p className="text-sm text-slate-600">Protected with industry-standard encryption.</p>
        </div>
      </div>
    </div>
  );
}
