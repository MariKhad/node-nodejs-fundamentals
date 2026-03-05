import fs from "fs/promises";
import path from "path";

/**
 * Рекурсивно сканирует директорию и собирает информацию о всех файлах и папках
 * @param {string} currentPath - Абсолютный путь к текущей директории для сканирования
 * @param {string} relativePath - Относительный путь от корневой директории (по умолчанию "")
 * @param {Array} entries - Массив для накопления результатов (используется при рекурсии)
 * @returns {Promise<Array>} Массив объектов с информацией о файлах и папках
 *
 * @example
 * // Возвращает массив вида:
 * [
 *   { path: "folder", type: "directory" },
 *   { path: "folder/file.txt", type: "file", size: 1234, content: "base64..." }
 * ]
 */
const scanDirectory = async (currentPath, relativePath = "", entries = []) => {
  const items = await fs.readdir(currentPath);

  for (const item of items) {
    const fullPath = path.join(currentPath, item);
    const itemStats = await fs.stat(fullPath);

    if (itemStats.isDirectory()) {
      entries.push({
        path: path.join(relativePath, item),
        type: "directory",
      });

      const subEntries = await scanDirectory(
        fullPath,
        path.join(relativePath, item),
      );

      entries.push(...subEntries);
    } else {
      const content = await fs.readFile(fullPath);

      entries.push({
        path: path.join(relativePath, item),
        type: "file",
        size: itemStats.size,
        content: content.toString("base64"),
      });
    }
  }

  return entries;
};

/**
 * Создает snapshot указанной директории со всем содержимым
 * Сканирует директорию рекурсивно и сохраняет структуру в snapshot.json
 * @async
 * @throws {Error} Если путь не указан или не существует
 * @throws {Error} Если путь указывает на файл, а не директорию
 * @throws {Error} "FS operation failed" при ошибках файловой системы
 *
 * @example
 * // Запуск: node snapshot.js /path/to/workspace
 * // Создает /path/to/workspace/snapshot.json
 */
const snapshot = async () => {
  let rawWorkspacePath = process.argv[2]?.replace(/^"|"$/g, "");

  if (!rawWorkspacePath) {
    throw new Error("Workspace path is required");
  }
  const workspacePath = path.resolve(rawWorkspacePath);

  try {
    await fs.access(workspacePath);
    const stats = await fs.stat(workspacePath);

    if (!stats.isDirectory()) {
      throw new Error("Path points to a FILE, but DIRECTORY is required");
    }

    console.log(`Scanning of ${workspacePath} starts...`);
    const entries = await scanDirectory(workspacePath, "");

    const snapshotData = {
      rootPath: workspacePath,
      entries: entries,
    };

    console.log(`Found ${snapshotData.entries.length} items`);

    const jsonContent = JSON.stringify(snapshotData, null, 2);

    const outputPath = path.join(workspacePath, "snapshot.json");

    await fs.writeFile(outputPath, jsonContent, "utf8");

    console.log(`Snapshot saved to: ${outputPath}`);
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error("Path does not exist:", workspacePath);
    } else if (error?.code === "EACCES") {
      console.error("No permission to access:", workspacePath);
    }
    throw new Error(`FS operation failed: ${error?.message || ""}`);
  }
};

await snapshot();
