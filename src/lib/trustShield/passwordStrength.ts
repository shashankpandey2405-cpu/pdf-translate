export type PasswordStrength = "weak" | "fair" | "strong";

export type PasswordStrengthResult = {
  strength: PasswordStrength;
  score: number;
  hints: string[];
};

export function scorePassword(password: string): PasswordStrengthResult {
  const hints: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else hints.push("Use at least 8 characters");

  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else hints.push("Mix upper and lower case");

  if (/\d/.test(password)) score += 1;
  else hints.push("Add a number");

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else hints.push("Add a symbol");

  const strength: PasswordStrength = score >= 4 ? "strong" : score >= 2 ? "fair" : "weak";
  return { strength, score, hints };
}
