import { useCountdownTimer } from "../hooks/useCountdownTimer";
import { AlertCircle } from "lucide-react";

export function CountdownDisplay({ targetDate, className = "" }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdownTimer(targetDate);

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-red-700 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Draw Ended</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="flex flex-col items-center">
        <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-emerald-700">{days}</p>
          <p className="text-xs font-medium text-emerald-600">Days</p>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-blue-700">{hours}</p>
          <p className="text-xs font-medium text-blue-600">Hours</p>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-purple-700">{minutes}</p>
          <p className="text-xs font-medium text-purple-600">Minutes</p>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="rounded-lg bg-gradient-to-br from-orange-50 to-red-50 px-3 py-2 text-center">
          <p className="text-xl font-bold text-orange-700">{seconds}</p>
          <p className="text-xs font-medium text-orange-600">Seconds</p>
        </div>
      </div>
    </div>
  );
}
