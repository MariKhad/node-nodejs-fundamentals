import readline from "readline";

/**
 * Запускает интерактивный интерфейс командной строки
 * Поддерживает команды: uptime, cwd, date, exit, help
 */
const interactive = () => {
  const commandDescription = {
    uptime: "Show process uptime",
    cwd: "Show current working directory",
    date: "Show current date and time (ISO)",
    exit: "Exit the program",
    help: "Show help message",
  };

  const handlers = {
    uptime: () => `Uptime: ${process.uptime().toFixed(2)}s`,
    cwd: () => `Current working directory: ${process.cwd()}`,
    date: () => `Current date: ${new Date().toISOString()}`,
    exit: (rl) => {
      console.log("Goodbye!");
      rl.close();
    },
    help: () => {
      for (let description in commandDescription) {
        console.log(`${description} - ${commandDescription[description]}`);
      }
    },
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt("> ");
  rl.prompt();
  rl.on("line", (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === "") return rl.prompt();

    if (handlers[cmd]) {
      const result = handlers[cmd](rl);
      if (result !== undefined) console.log(result);
      if (cmd !== "exit") rl.prompt();
    } else {
      console.log("Unknown command");
      console.log("Use command 'help' to get the list of commands");
      rl.prompt();
    }
  });

  rl.on("SIGINT", () => {
    console.log("Goodbye!");
    rl.close();
  });

  rl.on("close", () => {
    process.exit(0);
  });
};

interactive();
