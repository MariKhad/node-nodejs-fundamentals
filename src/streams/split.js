import fs from "fs";

/**
 * Получает количество строк для разбивание файла из аргументов командной строки
 * Возвращает размер чанка в строках
 */
const getChunkSize = () => {
  let chunkSize = 10;

  const chunkSizeIndex = process.argv.indexOf("--lines");

  if (chunkSizeIndex !== -1 && chunkSizeIndex + 1 < process.argv.length) {
    const possibleChunkSize = process.argv[chunkSizeIndex + 1];

    if (!isNaN(possibleChunkSize) && possibleChunkSize > 0) {
      chunkSize = parseInt(possibleChunkSize, 10);
    } else {
      console.log(
        `Wrong format of chunk size, will be used default size of ${chunkSize} lines`,
      );
    }
  }
  return chunkSize;
};

/**
 * Функция удаляет файлы вида "chunk_*.txt" созданные ранее;
 */
const cleanOldChunks = () => {
  const files = fs.readdirSync(".");
  const chunkFiles = files.filter((file) => /^chunk_\d+\.txt$/.test(file));

  chunkFiles.forEach((file) => {
    fs.unlinkSync(file);
  });
};

/**
 * Разбивает source.txt на несколько файлов chunk_*.txt
 * Каждый файл содержит одинаковое количество строк, которое задается через --lines
 * При неверном значении lines будет использовано дефолтное значение 10
 */
const split = async () => {
  cleanOldChunks();
  const linesPerChunk = getChunkSize();

  const readStream = fs.createReadStream("source.txt", { encoding: "utf8" });

  let buffer = "";
  let lineCount = 0;
  let chunkNumber = 1;
  let writeStream = null;

  readStream.on("data", (chunk) => {
    buffer += chunk;

    while (buffer.includes("\n")) {
      const newlineIndex = buffer.indexOf("\n");
      const line = buffer.slice(0, newlineIndex + 1);

      if (!writeStream || lineCount >= linesPerChunk) {
        if (writeStream) writeStream.end();
        writeStream = fs.createWriteStream(`chunk_${chunkNumber}.txt`);
        chunkNumber++;
        lineCount = 0;
      }

      writeStream.write(line);
      lineCount++;
      buffer = buffer.slice(newlineIndex + 1);
    }
  });

  readStream.on("end", () => {
    if (buffer.length > 0) {
      if (!writeStream || lineCount >= linesPerChunk) {
        if (writeStream) writeStream.end();
        writeStream = fs.createWriteStream(`chunk_${chunkNumber}.txt`);
      }
      writeStream.write(buffer);
    }

    if (writeStream) writeStream.end();
    console.log("File split successfully!");
  });

  readStream.on("error", (err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
};

await split();
