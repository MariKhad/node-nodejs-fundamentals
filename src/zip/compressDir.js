import { createReadStream, createWriteStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { PassThrough } from "stream";
import { pipeline } from "stream/promises";
import { createBrotliCompress } from "zlib";

/**
 * Определяет путь к рабочей директории из аргументов командной строки
 * По умолчанию это текущая рабочая директория (process.cwd())
 * Игнорирует флаги (начинающиеся с --)
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
 */
const checkAccess = async (path) => {
  try {
    await fs.access(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`File or directory does not exist: ${path}`);
    } else if (error.code === "EACCES") {
      console.error(`No permission to access: ${path}`);
    } else {
      console.error(`Unexpected error accessing ${path}:`, error.message);
    }
    throw new Error("FS operation failed");
  }
};

/**
 * Рекурсивно собирает все файлы из директории и её подпапок
 * Функция работает во всех версиях Node.js начиная с 10.10.0
 * В отличие от встроенного recursive: true, который появился только в Node.js 18+
 */
const getAllFiles = async (dir, baseDir = dir, fileList = []) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await getAllFiles(fullPath, baseDir, fileList);
    } else {
      const relativePath = path.relative(baseDir, fullPath);

      const stats = await fs.stat(fullPath);

      fileList.push({
        fullPath,
        relativePath,
        name: entry.name,
        size: stats.size,
      });
    }
  }

  return fileList;
};

/**
 • Записывает метаданные файла в поток архива.
 • Структура: [4 байта: длина пути][N байт: путь][8 байт: размер файла]
 */
async function writeFileHeaderToArchive(archiveStream, relativePath, fileSize) {
  const pathBuffer = Buffer.from(relativePath, "utf8");
  const PATH_LEN_BYTES = 4;
  const FILE_SIZE_BYTES = 8;

  const OFFSET = {
    PATH_LENGTH: 0,
    PATH: PATH_LEN_BYTES,
    FILE_SIZE: PATH_LEN_BYTES + pathBuffer.length,
  };

  const totalHeaderSize = PATH_LEN_BYTES + pathBuffer.length + FILE_SIZE_BYTES;
  const headerBuffer = Buffer.alloc(totalHeaderSize);

  headerBuffer.writeUInt32LE(pathBuffer.length, OFFSET.PATH_LENGTH);

  pathBuffer.copy(headerBuffer, OFFSET.PATH);

  headerBuffer.writeBigUInt64LE(BigInt(fileSize), OFFSET.FILE_SIZE);

  if (!archiveStream.write(headerBuffer)) {
    await new Promise((resolve) => archiveStream.once("drain", resolve));
  }
}

/**
 * Функция для архивации файлов из папки toCompress из указанной директории
 * Если директория не указана скприт будет автоматически искать ее в текущей рабочей директории
 */
const compressDir = async () => {
  const workspacePath = getWorkspacePath();
  const SOURCE_DIR = path.join(workspacePath, "toCompress");
  const TARGET_DIR = path.join(workspacePath, "compressed");
  const ARCHIVE_NAME = "archive.br";
  const ARCHIVE_PATH = path.join(TARGET_DIR, ARCHIVE_NAME);

  // Статус fs.exists мне непонятен, поэтому будет такая проверка
  try {
    await checkAccess(SOURCE_DIR);
    console.log(`Source directory exists: ${SOURCE_DIR}`);
  } catch (error) {
    return;
  }

  try {
    await fs.mkdir(TARGET_DIR, { recursive: true });

    const archiveStream = createWriteStream(ARCHIVE_PATH);
    const brotli = createBrotliCompress();

    const packStream = new PassThrough();

    const compressionPromise = pipeline(packStream, brotli, archiveStream);

    const filesInfo = await getAllFiles(SOURCE_DIR);

    for (const fileInfo of filesInfo) {
      await writeFileHeaderToArchive(
        packStream,
        fileInfo.relativePath,
        fileInfo.size,
      );

      const readStream = createReadStream(fileInfo.fullPath);

      for await (const chunk of readStream) {
        if (!packStream.write(chunk)) {
          await new Promise((resolve) => packStream.once("drain", resolve));
        }
      }

      console.log(`✅ ${fileInfo.name}`);
    }

    packStream.end();

    await compressionPromise;

    console.log("Все файлы обработаны и архив создан!");
  } catch (error) {
    console.error(error);
    throw new Error("FS operation failed");
  }
};

await compressDir();
