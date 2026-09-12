export function sanitizeForExternalModel(input?: string | null) {
  if (!input) return "";
  const blocked = /(password|user\s*name|username|login details|author login|reset password|remove my information|remove my details|editorialmanager\.com\/.*login)/i;
  return input
    .split(/\r?\n/)
    .filter((line) => !blocked.test(line))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function section(title: string, body?: string | null) {
  const text = (body || "").trim();
  return text ? `## ${title}\n\n${text}` : "";
}
