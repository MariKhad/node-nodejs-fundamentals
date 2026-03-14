import { spawn } from "child_process";

/**
 * Запускает команду из аргументов командной строки
 * Команду обязательно передавать в кавычках.
 * Тестировалось только на Windows и через git bash, с русским текстом проблемы с кодировкой.
 * Некоторые встроенные команды Win не работают через git bash, а вот команды для Linux работают
 * @example
 * node execCommand.js "dir"
 * node execCommand.js "echo Привет"
 *
 */

const execCommand = () => {
  const command = process.argv[2];
  if (!command) {
    console.error("Command is required");
    process.exit(1);
  }

  const [cmd, ...args] = command.split(" ");

  const child = spawn(cmd, args, {
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on("exit", (code) => {
    process.exit(code);
  });

  child.on("error", (err) => {
    console.error("Failed to start command:", err.message);
    process.exit(1);
  });
};

execCommand();
