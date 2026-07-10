import FeatureItem from "./FeatureItem";
export default function BrandingPanel({ className = "", variant = "card" }) {
  const isEmbedded = variant === "embedded";

  return (
    <div
      className={`h-full overflow-hidden bg-white ${
        isEmbedded
          ? ""
          : "rounded-[24px] border border-[#E8EDF3] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
      } ${className}`}
    >
      <div className="p-6 sm:p-8 xl:p-10">
        <div className="mb-8 xl:mb-10">
          <img src="/logo.svg" alt="Fairway Impact" className="h-14" />
        </div>

        <h1 className="text-4xl font-bold leading-[1.08] tracking-[-1px] text-[#111827] sm:text-5xl xl:text-[54px] xl:leading-[60px]">
          Join Fairway <span className="text-[#148BA6]">Impact</span>
        </h1>

        <p className="mt-6 text-[18px] leading-8 text-[#64748B]">
          Track your performance. Win rewards.<br></br> Support charities. Create real
          impact.
        </p>
<br></br>
<FeatureItem />
        </div>
    </div>
  );
}
