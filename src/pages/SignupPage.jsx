import BrandingPanel from "../components/branding/BrandingPanel";
import SignUpForm from "../components/auth/SignUpForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] px-4 py-6 font-['Inter',sans-serif] text-[#111827] sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1180px] items-center">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-[28px] border border-[#E8EDF3] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="min-h-full bg-white">
            <BrandingPanel variant="embedded" />
          </div>

          <div className="flex items-center justify-center border-t border-[#E8EDF3] bg-[#FFFFFF] p-5 sm:p-8 lg:border-l lg:border-t-0 xl:p-10">
            <div className="w-full max-w-[560px]">
              <SignUpForm variant="embedded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
