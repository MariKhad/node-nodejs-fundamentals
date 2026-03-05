import fs from "fs/promises";
import path from "path";

/**
 * Получает расширение для поиска из аргументов командной строки
 * @returns {string} Расширение файла (с точкой)
 * @example
 * // --ext txt возвращает ".txt"
 */
const findExt = () => {
  let ext = ".txt";

  const extIndex = process.argv.indexOf("--ext");

  if (extIndex !== -1 && extIndex + 1 < process.argv.length) {
    let argExt = process.argv[extIndex + 1];

    if (!argExt.startsWith(".")) {
      ext = "." + argExt;
    } else {
      ext = argExt;
    }
  }
  return ext;
};

/**
 * Рекурсивно ищет файлы с указанным расширением в директории
 * @param {string} currentPath - Путь к текущей директории для поиска
 * @param {string} extension - Расширение файла (с точкой)
 * @param {string} relativePath - Относительный путь от корня (для формирования результата)
 * @returns {Promise<string[]>} Массив найденных файлов с относительными путями
 * @throws {Error} Если возникла ошибка при чтении директории
 *
 * @example
 * // Поиск всех .txt файлов в ./workspace
 * const files = await findFilesByExt('./workspace', '.txt');
 * // возвращает ['file1.txt', 'subdir/file2.txt', 'docs/readme.txt']
 */
const findFilesByExt = async (currentPath, extension, relativePath = "") => {
  try {
    const foundFiles = [];
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const subDirFiles = await findFilesByExt(
          fullPath,
          extension,
          path.join(relativePath, item),
        );
        foundFiles.push(...subDirFiles);
      } else if (stats.isFile() && item.endsWith(extension)) {
        foundFiles.push(path.join(relativePath, item));
      }
    }

    return foundFiles;
  } catch (error) {
    console.error(`Error reading directory ${currentPath}:`, error.message);
    throw new Error(`Failed to scan directory: ${currentPath}`);
  }
};

/**
 * Основная функция для поиска файлов по расширению
 * Принимает путь к директории из аргументов командной строки
 * Выводит отсортированный список найденных файлов с указанным расширением
 * @async
 * @throws {Error} Если путь не указан или не существует
 * @throws {Error} Если путь указывает на файл, а не директорию
 * @throws {Error} "FS operation failed" при ошибках файловой системы
 *
 * @example
 * // Запуск: node findByExt.js "/path/to/workspace" --ext js
 * // Вывод: список всех .js файлов (точка добавляется автоматически)
 */
const findByExt = async () => {
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

    const ext = findExt();

    console.log(`Scanning of ${workspacePath} starts...`);

    const foundFiles = await findFilesByExt(workspacePath, ext, "");

    if (!foundFiles.length) {
      console.log(
        `No files with the extension ${ext} were found in the specified directory.`,
      );

      return;
    }

    foundFiles.sort();

    for (const filePath of foundFiles) {
      console.log(filePath);
    }

    return;
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error("Path does not exist:", workspacePath);
    }
    throw new Error(`FS operation failed: ${error?.message || ""}`);
  }
};

await findByExt();
