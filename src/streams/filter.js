import { Transform } from "stream";

/**
 * Получает паттерн для фильтрации из аргументов командной строки
 */
const getPattern = () => {
  let pattern = "";

  const patternIndex = process.argv.indexOf("--pattern");

  if (patternIndex !== -1 && patternIndex + 1 < process.argv.length) {
    pattern = process.argv[patternIndex + 1];
  }
  return pattern;
};

/**
 * По заданию функция фильтрует строки вводимые из коммандной строки по определенному паттерну вводимому как аргумент
 */
const filter = () => {
  const pattern = getPattern();
  let buffer = "";

  const transformer = new Transform({
    transform(chunk, _, callback) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.includes(pattern)) {
          this.push(line + "\n");
        }
      }
      callback();
    },

    flush(callback) {
      if (buffer && buffer.includes(pattern)) {
        this.push(buffer + "\n");
      }
      callback();
    },
  });

  process.stdin.pipe(transformer).pipe(process.stdout);

  process.stdin.on("error", (err) => {
    console.error("Input error:", err.message);
    process.exit(1);
  });
};

filter();
