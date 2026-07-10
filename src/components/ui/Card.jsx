import clsx from "clsx";

export default function Card({ as: Component = "div", className, children, ...props }) {
  return (
    <Component
      className={clsx(
        "w-full box-border overflow-hidden rounded-[32px] bg-white shadow-xl dark:bg-slate-800 dark:border-slate-700",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
