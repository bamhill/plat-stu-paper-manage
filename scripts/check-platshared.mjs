import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedRoot = path.resolve(process.env.PLAT_SHARED_DIR || path.join(root, "..", "PlatShared"));
const registryDir = path.join(sharedRoot, "registry");
const targets = ["work_registry.json", "source_registry.json", "platform_registry.json"];

const report = {
  mode: "standalone",
  sharedRoot,
  readOnly: true,
  autoMergeByTitle: false,
  crossDbWrite: false,
  registries: {},
  warnings: [],
};

if (!fs.existsSync(sharedRoot)) {
  console.log(`[PlatShared] 未检测到 ${sharedRoot}；投稿平台按独立模式运行。`);
  process.exit(0);
}

report.mode = "shared-detected";
for (const name of targets) {
  const file = path.join(registryDir, name);
  if (!fs.existsSync(file)) {
    report.registries[name] = { exists: false };
    report.warnings.push(`${name} 不存在`);
    continue;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const count = Array.isArray(parsed)
      ? parsed.length
      : Array.isArray(parsed?.items) ? parsed.items.length
      : Array.isArray(parsed?.works) ? parsed.works.length
      : Array.isArray(parsed?.sources) ? parsed.sources.length
      : Object.keys(parsed || {}).length;
    report.registries[name] = { exists: true, validJson: true, count };
  } catch (error) {
    report.registries[name] = { exists: true, validJson: false };
    report.warnings.push(`${name} JSON 无法解析：${String(error?.message || error)}`);
  }
}

console.log(`[PlatShared] 已只读检测：${sharedRoot}`);
console.log(JSON.stringify(report, null, 2));
// Shared-layer problems never block standalone operation; this script never writes PlatShared.
process.exit(0);
