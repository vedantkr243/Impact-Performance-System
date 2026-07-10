import { Apple, Chrome } from "lucide-react";
import Button from "../ui/Button";

export default function SocialLogin() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Button
        variant="secondary"
        className="h-12 w-full gap-2 rounded-xl border-[#E5E7EB] bg-white font-medium transition hover:bg-[#F8FAFC]"
      >
        <Chrome size={18} />
        Google
      </Button>

      <Button
        variant="secondary"
        className="h-12 w-full gap-2 rounded-xl border-[#E5E7EB] bg-white font-medium transition hover:bg-[#F8FAFC]"
      >
        <Apple size={18} />
        Apple
      </Button>
    </div>
  );
}
