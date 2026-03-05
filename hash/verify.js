import fs from "fs/promises";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "path";

/**
 * Определяет путь к рабочей директории из аргументов командной строки
 * По умолчанию это текущая рабочая директория (process.cwd())
 * Игнорирует флаги (начинающиеся с --)
 * @returns {string} Абсолютный путь к рабочей директории
 *
 * @example
 * // node script.js ./my-workspace
 * // return '/absolute/path/to/my-workspace'
 *
 * // node script.js (без указания пути)
 * // return process.cwd()
 *
 * // node script.js --some-flag ./my-workspace
 * // return '/absolute/path/to/my-workspace' (флаг игнорируется)
 */
const getWorkspacePath = () => {
  let workspacePath = process.cwd();
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (!arg.startsWith("--")) {
      workspacePath = arg.replace(/^"|"$/g, "");
      break;
    }
  }

  return workspacePath;
};

/**
 * Проверяет доступ к файлу по указанному пути
 * Логирует детали ошибки, но выбрасывает стандартное сообщение
 * @async
 * @param {string} path - Путь к файлу для проверки
 * @throws {Error} "FS operation failed" при любой ошибке доступа
 * @returns {Promise<void>}
 *
 * @example
 * // Проверка существующего файла
 * await checkFileAccess('./workspace/file.txt');
 * // (тихо проходит, если файл доступен)
 */
const checkFileAccess = async (path) => {
  try {
    await fs.access(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`File does not exist: ${path}`);
    } else if (error.code === "EACCES") {
      console.error(`No permission to access: ${path}`);
    } else {
      console.error(`Unexpected error accessing ${path}:`, error.message);
    }
    throw new Error("FS operation failed");
  }
};
/**
 * Проверяет существование файлов в указанной директории
 * @param {string} dirPath - Путь к директории с файлами
 * @param {string[]} files - Массив имен файлов для проверки
 * @returns {Promise<string[]>} Массив только существующих файлов
 */
const getExistingFiles = async (dirPath, files) => {
  const existenceChecks = await Promise.all(
    files.map(async (file) => {
      try {
        await fs.access(path.join(dirPath, file));
        return true;
      } catch {
        return false;
      }
    }),
  );

  const missing = files.filter((_, index) => !existenceChecks[index]);

  if (missing.length > 0) {
    console.log(`Files not found: ${missing.join(", ")}`);
  }

  return files.filter((_, index) => existenceChecks[index]);
};

/**
 * Вычисляет SHA256 хеш файла
 * @param {string} filePath - Путь к файлу
 * @returns {Promise<string>} Хеш в hex формате
 */
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
};

/**
 * Функция верификации файлов по их контрольным суммам
 * Читает файл checksums.json из указанной директории, если не указана то из рабочей директории,
 * Вычисляет SHA256 хеши для каждого указанного файла и сравнивает с ожидаемыми значениями
 * @async
 * @throws {Error} "FS operation failed" при критических ошибках:
 * - Отсутствует или недоступен файл checksums.json
 * - Невалидный JSON в checksums.json
 * - Ошибки доступа к проверяемым файлам
 * @returns {Promise<void>}
 *
 * @example
 * // Запуск с указанием рабочей директории
 * // node verify.js "./workspace"
 * // Пример вывода:
 * // file1.txt — OK
 * // file2.txt — FAIL
 * // Files not found: file3.jpg
 */
const verify = async () => {
  const workspacePath = getWorkspacePath();

  const checksumsPath = path.join(workspacePath, "checksums.json");

  await checkFileAccess(checksumsPath);

  const data = await fs.readFile(checksumsPath, "utf8");

  let checksums = "";

  try {
    checksums = JSON.parse(data);
  } catch (error) {
    console.error("Invalid JSON in checksums.json");
    throw new Error("FS operation failed");
  }

  const allFiles = Object.keys(checksums);

  const existingFiles = await getExistingFiles(workspacePath, allFiles);

  if (existingFiles.length === 0) {
    console.log("No files to verify");
    return;
  }

  for (let file of existingFiles) {
    const filePath = path.join(workspacePath, file);
    await checkFileAccess(filePath);

    const fileHash = await calculateFileHash(filePath);
    const expectedHash = checksums[file];
    const result = fileHash === expectedHash ? "OK" : "FAIL";

    console.log(`${file} — ${result}`);
  }
  return;
};

await verify();
