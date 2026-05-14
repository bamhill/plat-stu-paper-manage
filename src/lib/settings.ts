import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

interface AppSettings {
  fileRootDir: string;
  organizeByStudent: boolean;
  degreeTypes: string[];
  aiMode: "off" | "local" | "cloud";
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
  dashboardStatusFilter: string[];
}

const ALL_STATUSES = ["writing", "ready_to_submit", "submitted", "with_editor", "under_review", "minor_revision", "major_revision", "accepted", "rejected", "published"];

const DEFAULT_SETTINGS: AppSettings = {
  fileRootDir: "data/files",
  organizeByStudent: true,
  degreeTypes: ["工学硕士", "工业工程专硕", "MBA全日制", "MEM非全", "MBA非全"],
  aiMode: "local",
  aiApiKey: "",
  aiApiUrl: "https://api.deepseek.com/v1",
  aiModel: "deepseek-chat",
  dashboardStatusFilter: ALL_STATUSES,
};

export function getSettings(): AppSettings {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors, use defaults
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): AppSettings {
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
}
