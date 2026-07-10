import { ShieldCheck } from "lucide-react";
import golfer from "../../assets/golfer.png";

import {
  Trophy,
  Heart,
  TrendingUp,
} from "lucide-react";

export default function FeatureItem(){
   return (
    <div>
      <div>
      {/* Feature 1 */}
  <div className="flex items-start gap-4">
    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
      <Trophy className="w-6 h-6 text-emerald-700" />
    </div>

    <div>
      <h4 className="font-semibold text-[#111827] text-lg">
        Win Monthly Rewards
      </h4>

      <p className="text-[#64748B] text-sm leading-6 mt-1">
        Enter draws every month and stand a chance
        to win amazing prizes.
      </p>
    </div>
  </div>
        {/* Feature 2 */}
  <div className="flex items-start gap-4">
    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
      <Heart className="w-6 h-6 text-emerald-700" />
    </div>

    <div>
      <h4 className="font-semibold text-[#111827] text-lg">
        Support Meaningful Causes
      </h4>

      <p className="text-[#64748B] text-sm leading-6 mt-1">
        A portion of your subscription goes towards
        charities you care about.
      </p>
    </div>
  </div>

  {/* Feature 3 */}
  <div className="flex items-start gap-4">
    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
      <TrendingUp className="w-6 h-6 text-emerald-700" />
    </div>

    <div>
      <h4 className="font-semibold text-[#111827] text-lg">
        Improve Your Game
      </h4>

      <p className="text-[#64748B] text-sm leading-6 mt-1">
        Track your scores, analyze performance,
        and become a better player.
      </p>
    </div>
  </div>


      </div>

      <img
        src={golfer}
        alt="Golfer swinging a club"
        className="h-56 w-full object-fill sm:h-64 xl:h-[280px]"
      />

      <div className="border-t border-slate-200 p-6">
  <div className="flex items-start gap-4">

    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
      <ShieldCheck className="h-6 w-6 text-emerald-700" />
    </div>

    <div>
      <h4 className="font-semibold text-[#111827]">
        Your data is safe with us
      </h4>

      <p className="text-sm text-[#64748B] mt-1">
        We use industry-standard encryption to
        protect your information.
      </p>
    </div>

  </div>
</div>
      </div>
   );
};
