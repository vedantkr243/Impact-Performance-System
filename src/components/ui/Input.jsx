import clsx from "clsx";

export default function Input({ label, id, className, inputClassName, ...props }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="mb-2 block font-medium text-slate-700">
          {label}
        </label>
      ) : null}

      <input
        id={id}
        className={clsx(
          "h-12 w-full rounded-xl border border-[#d1d5db] px-4 text-base text-slate-900 outline-none transition duration-200 focus:border-[#0f766e] focus:ring-4 focus:ring-[rgba(15,118,110,.15)]",
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}
