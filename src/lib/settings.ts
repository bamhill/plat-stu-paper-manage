import { prisma } from "@/lib/prisma";

export { DEFAULT_SETTINGS } from "@/lib/settings-default";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/settings-default";

export async function getSettings(teacherId: number): Promise<AppSettings> {
  const row = await prisma.teacherSetting.findUnique({ where: { teacherId } });
  if (!row) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.configJson) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(teacherId: number, settings: AppSettings): Promise<AppSettings> {
  await prisma.teacherSetting.upsert({
    where: { teacherId },
    create: { teacherId, configJson: JSON.stringify(settings) },
    update: { configJson: JSON.stringify(settings) },
  });
  return settings;
}

export async function updateSetting<K extends keyof AppSettings>(teacherId: number, key: K, value: AppSettings[K]): Promise<AppSettings> {
  const settings = await getSettings(teacherId);
  settings[key] = value;
  return saveSettings(teacherId, settings);
}
