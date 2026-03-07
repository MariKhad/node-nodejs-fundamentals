import fs from "fs/promises";
import path from "path";

/**
 * Парсит аргументы командной строки для получения списка файлов после флага --files
 * Возвращает массив имен файлов
 * @example
 * // node script.js --files file1.txt,file2.txt
 * // return ['file1.txt', 'file2.txt']
 */
const parseFilesOrder = () => {
  let filesOrder = [];

  const filesIndex = process.argv.indexOf("--files");

  if (filesIndex !== -1 && filesIndex + 1 < process.argv.length) {
    let argFiles = process.argv[filesIndex + 1];

    filesOrder = argFiles.split(",");
  }
  return filesOrder;
};

/**
 * Проверяет существование файлов и их расширение в указанной директории
 * @example
 * // Проверяет файлы file1.txt и file2.txt в папке "C:\Users\test\parts"
 * await validateFilesExist("C:\Users\test\parts", ['file1.txt', 'file2.txt'])
 */
const validateFilesExist = async (partsPath, files) => {
  const missingFiles = [];
  const invalidExtFiles = [];

  for (const file of files) {
    if (path.extname(file).toLowerCase() !== ".txt") {
      invalidExtFiles.push(file);
      continue;
    }

    try {
      await fs.access(path.join(partsPath, file));
    } catch {
      missingFiles.push(file);
    }
  }

  if (invalidExtFiles.length > 0 || missingFiles.length > 0) {
    let errorMessage = "";

    if (invalidExtFiles.length > 0) {
      errorMessage += `\n  Invalid Extention ${invalidExtFiles.join(", ")} (.txt is needed)`;
    }

    if (missingFiles.length > 0) {
      errorMessage += `\n  Files missing: ${missingFiles.join(", ")}`;
    }

    throw new Error(errorMessage);
  }

  return true;
};

/**
 * Определяет путь к рабочей директории из аргументов командной строки
 * По умолчанию это текущая рабочая директория (process.cwd())
 * Игнорирует флаги (начинающиеся с --) и значения после --files
 *
 * @example
 * // node script.js --files file1.txt "./my-workspace"
 * // return '/absolute/path/to/my-workspace'
 *
 * // node script.js (без указания пути)
 * // return process.cwd()
 */
const getWorkspacePath = () => {
  let workspacePath = process.cwd();
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (!arg.startsWith("--") && process.argv[i - 1] !== "--files") {
      workspacePath = arg.replace(/^"|"$/g, "");
      break;
    }
  }

  return workspacePath;
};

/**
 * Функция "склеивания" файлов из определенной директории
 * Если переда порядок файлов, то склеивает в этом порядке
 * Если не передан то склеивает в порядке обычной сортировки
 * Порядок должен передаваться одной строкой после --files
 */
const merge = async () => {
  let workspacePath = getWorkspacePath();

  const customFiles = parseFilesOrder();
  const useCustomOrder = customFiles.length > 0;

  const partsDirPath = path.join(workspacePath, "parts");

  try {
    await fs.access(partsDirPath);
    const allFiles = await fs.readdir(partsDirPath);
    let filesToMerge = [];
    let mergedContent = "";

    if (useCustomOrder) {
      await validateFilesExist(partsDirPath, customFiles);

      filesToMerge = customFiles;
    } else {
      filesToMerge = allFiles
        .filter((file) => path.extname(file).toLowerCase() === ".txt")
        .sort();
      if (filesToMerge.length < 1) {
        throw new Error("There is no txt files in the directory");
      }
    }

    for (const file of filesToMerge) {
      const filePath = path.join(partsDirPath, file);
      const content = await fs.readFile(filePath, { encoding: "utf8" });

      if (content.length === 0) {
        console.log(`File ${file} is empty!`);
      }

      mergedContent += content + "\n\n";
    }
    await fs.writeFile(path.join(workspacePath, "merged.txt"), mergedContent);
    return;
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error("Path does not exist:", partsDirPath);
    }
    throw new Error(`FS operation failed: ${error?.message || ""}`);
  }
};

await merge();
