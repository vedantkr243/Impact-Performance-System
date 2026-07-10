const normalizeRole = (accountTypeOrRole) => {
  const value = String(accountTypeOrRole || "user").trim().toLowerCase();

  if (value === "admin") {
    return "admin";
  }

  if (value === "instructor") {
    return "instructor";
  }

  return "user";
};

module.exports = normalizeRole;
