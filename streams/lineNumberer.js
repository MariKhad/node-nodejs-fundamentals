import { Transform } from "stream";

/**
 * По заданию функция нумерует строки вводимые из коммандной строки
 * Добавила обработку чисел отдельно от основного задания,
 * Если ввести строку состоящую только из чисел, программа вернет число возведенное в 3й степень
 * потому что захотелось поэкспериментировать с условиями.
 */
const lineNumberer = () => {
  let lineNumber = 1;

  const transformer = new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split("\n");
      const numbered = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return line;

        const isIntNumber = /^\d+$/.test(trimmed);
        if (isIntNumber) {
          return `A number raised to the 3rd power ${String(parseInt(trimmed, 10) ** 3)}`;
        } else {
          return `${lineNumber++} | ${line}`;
        }
      });
      callback(null, numbered.join("\n"));
    },
  });
  process.stdin.pipe(transformer).pipe(process.stdout);
};

lineNumberer();
