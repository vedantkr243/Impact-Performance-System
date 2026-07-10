import clsx from "clsx";

const variants = {
  primary: "border-none bg-[#0f766e] text-white hover:bg-[#115e59]",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}) {
  return (
    <Component
      {...(Component === "button" ? { type } : {})}
      className={clsx(
        "inline-flex h-12 cursor-pointer items-center justify-center rounded-xl px-4 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
