import React, { useEffect, useState } from "react";
import { staticDataService } from "../../services/staticDataService";

const defaultLevels = [
  { label: "Weak", color: "bg-red-500", text: "text-red-500" },
  { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", color: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", color: "bg-emerald-600", text: "text-emerald-600" }
];

function getPasswordScore(password = "") {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.max(1, score);
}

export default function PasswordStrength({ password }) {
  const [levels, setLevels] = useState(defaultLevels);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getUiConstants();
        if (data && Array.isArray(data.passwordLevels)) setLevels(data.passwordLevels);
      } catch (e) {
        console.warn("Failed to load UI constants, using defaults", e);
      }
    })();
  }, []);

  const score = getPasswordScore(password);
  const level = levels[score - 1] || levels[levels.length - 1];

  return (
    <div>
      <div className="mb-2 flex gap-2">
        {levels.map((item, index) => (
          <div
            key={item.label}
            className={`h-1 flex-1 rounded ${index < score ? level.color : "bg-slate-200"}`}
          />
        ))}
      </div>

      <span className={`text-xs font-medium ${level.text}`}>{level.label}</span>
    </div>
  );
}

