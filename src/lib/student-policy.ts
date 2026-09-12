const BLOCKED_STUDENT_NAMES = new Set(["刘慧云"]);

export function assertStudentAllowed(name: string) {
  const normalized = (name || "").trim();
  if (BLOCKED_STUDENT_NAMES.has(normalized)) {
    throw new Error(`学生 ${normalized} 已移出当前管理名单`);
  }
}

export function isStudentAllowed(name: string) {
  return !BLOCKED_STUDENT_NAMES.has((name || "").trim());
}
