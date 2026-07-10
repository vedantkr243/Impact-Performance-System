import { Chrome, Apple } from "lucide-react";
import Button from "../ui/Button";

export default function SocialButtons() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
      <Button variant="secondary" className="flex items-center justify-center gap-2 w-full py-3">
        <Chrome size={18} />
        <span>Google</span>
      </Button>

      <Button variant="secondary" className="flex items-center justify-center gap-2 w-full py-3">
        <Apple size={18} />
        <span>Apple</span>
      </Button>
    </div>
  );
}
