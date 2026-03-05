import { Transform } from "stream";

/**
 * Получает паттерн для фильтрации из аргументов командной строки
 * @returns {string} Паттерн для фильтрацииа
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

  if (!pattern) {
    console.error("Pattern is required");
    process.exit(1);
  }

  const transformer = new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split("\n");
      const filtered = lines.filter((line) => line.includes(pattern));

      const result = filtered.join("\n") + (filtered.length > 0 ? "\n" : "");

      callback(null, result);
    },
  });
  process.stdin.pipe(transformer).pipe(process.stdout);
};

filter();
