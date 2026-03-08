import { Transform } from "stream";

/**
 * По заданию функция нумерует строки вводимые из коммандной строки
 * Если ввести строку в которой есть \n, это воспримется как перенос строки
 * Проверила варианты ниже Powershell и Git Bash. OS Win 11
 * @example
 * // Git Bash — интерактивный режим
 * $ node lineNumberer.js
 * (ввод строк вручную, Ctrl+C для выхода)
 *
 * // PowerShell
 * echo "Hello`nWorld" | node lineNumberer.js
 */
const lineNumberer = () => {
  let lineNumber = 1;
  let buffer = "";

  const transformer = new Transform({
    transform(chunk, encoding, callback) {
      buffer += chunk.toString();

      const lines = buffer.replace(/\\n/g, "\n").split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        this.push(`${lineNumber++} | ${line}\n`);
      }

      callback();
    },

    flush(callback) {
      if (buffer) {
        const finalLine = buffer.replace(/\\n/g, "\n");
        this.push(`${lineNumber} | ${finalLine}\n`);
      }
      callback();
    },
  });

  process.stdin.pipe(transformer).pipe(process.stdout);
};

lineNumberer();
