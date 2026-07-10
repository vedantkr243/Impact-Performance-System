import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import { z } from "zod";
import "react-phone-input-2/lib/style.css";
import Button from "../ui/Button";
import PasswordStrength from "./PasswordStrength";
import SocialLogin from "./SocialLogin";
import React, { useEffect } from "react";
import { staticDataService } from "../../services/staticDataService";
import { authService } from "../../services/authService";

const defaultCharities = [];

const fieldClass =
  "h-12 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#148BA6] focus:ring-4 focus:ring-[#148BA6]/10";

const labelClass = "mb-2 block text-sm font-medium text-[#111827]";

const schema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(6, "Enter a phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    charity: z.string().optional(),
    contribution: z.number().min(10).max(50),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept terms" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export default function SignUpForm({ variant = "card" }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      charity: "",
      contribution: 10,
      acceptedTerms: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const contribution = watch("contribution");
  const password = watch("password");
  const isEmbedded = variant === "embedded";

  const [charities, setCharities] = useState(defaultCharities);

  useEffect(() => {
    (async () => {
      try {
        const signupData = await staticDataService.getSignupData();
        const signupCharities = Array.isArray(signupData?.charities) ? signupData.charities : [];

        if (signupCharities.length) {
          setCharities(signupCharities);
          return;
        }

        const dashboardData = await staticDataService.getDashboardStatic();
        const dashboardCharities = Array.isArray(dashboardData?.charities) ? dashboardData.charities : [];
        setCharities(dashboardCharities);
      } catch (e) {
        console.warn("Failed to load signup charities, using defaults", e);
        setCharities(defaultCharities);
      }
    })();
  }, []);

  async function onSubmit(values) {
    try {
      // map form values to backend payload shape
      const payload = {
        name: values.fullName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        accountType: "user",
        contactNumber: values.phone || null,
        selectedCharityName: values.charity || null,
        plan: values.contribution || null
      };

      await authService.signup(payload);

      // navigate to dashboard after successful signup
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Signup failed", err);
      alert(err?.message || "Signup failed. Please try again.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={
        isEmbedded
          ? "bg-white"
          : "rounded-[24px] border border-[#E8EDF3] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:p-8 xl:p-10"
      }
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#111827] sm:text-[36px]">
          Create Your Account
        </h2>

        <p className="mt-2 text-[#64748B]">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-[#148BA6]">
            Log in
          </a>
        </p>
      </div>

      <SocialLogin />

      <div className="relative my-8">
        <div className="h-px bg-[#E5E7EB]" />
        <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white px-4 text-sm text-slate-400">
          or sign up with email
        </span>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="fullName" className={labelClass}>
            Full Name
          </label>
          <input
            {...register("fullName")}
            id="fullName"
            className={fieldClass}
            placeholder="Enter your full name"
            autoComplete="name"
          />
          {errors.fullName ? (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              className={fieldClass}
              placeholder="Email"
              autoComplete="email"
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  country="in"
                  inputProps={{
                    name: "phone",
                    required: true,
                    className:
                      "h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-12 pr-4 text-[#111827] outline-none transition focus:border-[#148BA6] focus:ring-4 focus:ring-[#148BA6]/10",
                    autoComplete: "tel",
                  }}
                  containerClass="!w-full"
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />
            {errors.phone ? (
              <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                className={`${fieldClass} pr-14`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm text-[#64748B]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="mt-2">
              <PasswordStrength password={password} />
            </div>
            {errors.password ? (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className={`${fieldClass} pr-14`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm text-[#64748B]"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="charity" className={labelClass}>
            Select Charity
          </label>
          <select {...register("charity")} id="charity" className={fieldClass}>
            <option value="">Search and select a charity</option>
            {charities.map((charity) => {
              const charityName = typeof charity === "string" ? charity : charity.name;

              return (
                <option key={charityName} value={charityName}>
                  {charityName}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="contribution" className={labelClass}>
              Charity Contribution
            </label>
            <span className="rounded-lg border border-[#E5E7EB] px-3 py-1 font-semibold text-[#111827]">
              {contribution}%
            </span>
          </div>

          <Controller
            control={control}
            name="contribution"
            render={({ field }) => (
              <input
                id="contribution"
                type="range"
                min={10}
                max={50}
                value={field.value}
                onChange={(event) => field.onChange(Number(event.target.value))}
                className="w-full accent-[#0F766E]"
              />
            )}
          />
        </div>

        <div className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
          <p className="text-sm text-[#15803D]">
            You&apos;re amazing! With {contribution}% contribution, you&apos;ll
            help create a bigger impact.
          </p>
        </div>

        <label className="flex gap-3 text-sm text-[#64748B]">
          <input
            type="checkbox"
            {...register("acceptedTerms")}
            className="mt-1 accent-[#0F766E]"
          />
          <span>I agree to the Terms & Conditions and Privacy Policy</span>
        </label>
        {errors.acceptedTerms ? (
          <p className="text-sm text-red-500">{errors.acceptedTerms.message}</p>
        ) : null}

        <Button
          type="submit"
          className="h-14 w-full rounded-xl bg-[#0F766E] font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:bg-[#115E59] active:scale-[0.99]"
        >
          Create Account
        </Button>
      </form>
    </motion.div>
  );
}





