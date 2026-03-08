import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Проверяет доступ к плагину
 * Прекращает программу если к плагину нет доступа
 */
const checkFileAccess = async (path) => {
  try {
    await fs.access(path);
  } catch (error) {
    console.error(`Plugin not found: ${path}`);
    process.exit(1);
  }
};

/**
 * Динамически подгружает плагины
 * Адреса плагинов берутся как аргумент командной строки
 */
const dynamic = async () => {
  const pluginName = process.argv[2];

  const dirname = path.dirname(fileURLToPath(import.meta.url));

  if (!pluginName) {
    console.error("Plugin name is required");
    process.exit(1);
  }

  try {
    const fileName = pluginName?.endsWith(".js")
      ? pluginName
      : `${pluginName}.js`;

    const pluginPath = path.join(dirname, "plugins", fileName);

    await checkFileAccess(pluginPath);

    const pluginUrl = new URL(`file://${pluginPath}`).href;
    const plugin = await import(pluginUrl);

    if (typeof plugin.run !== "function") {
      console.error("Plugin invalid: missing run() function");
      process.exit(1);
    }

    const result = plugin.run();
    console.log(result);
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      console.error("Plugin not found");
    } else {
      console.error("Error loading plugin");
    }
    process.exit(1);
  }
};
await dynamic();
