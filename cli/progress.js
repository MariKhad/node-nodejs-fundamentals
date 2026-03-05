/**
 * Карта аргументов командной строки
 */
const ARGUMENT_MAP = {
  "--duration": {
    name: "duration",
    defaultValue: 5000,
    validatedValue: (value) =>
      isNumberValid(value) ? parseInt(value, 10) : null,
  },
  "--interval": {
    name: "interval",
    defaultValue: 100,
    validatedValue: (value) =>
      isNumberValid(value) ? parseInt(value, 10) : null,
  },
  "--length": {
    name: "length",
    defaultValue: 30,
    validatedValue: (value) =>
      isNumberValid(value) ? parseInt(value, 10) : null,
  },
  "--color": {
    name: "color",
    defaultValue: "",
    validatedValue: (value) => (isHexValid(value) ? value : null),
  },
};

/**
 * Проверяет, является ли строка валидным HEX в формате #RRGGBB
 * @param {string} color - Строка для проверки
 * @returns {boolean} true если HEX в верном формате, иначе false
 *
 * @example
 * isHexValid('#FF0000') // true
 */
const isHexValid = (hex) => {
  if (typeof hex !== "string") return false;
  const hexRegex = /^#([A-Fa-f0-9]{6})$/;

  return hexRegex.test(hex);
};

const colorProgressBar = (str, hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `\x1b[38;2;${r};${g};${b}m${str}\x1b[0m`;
};

/**
 * Проверяет, является ли значение неотрицательным числом
 * @param {string} value - Проверяемое значение
 * @returns {number|null} Число или null
 */
const isNumberValid = (value) => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 0 && num < Infinity ? num : null;
};

/**
 * Парсит аргументы командной строки
 * @returns {Object} Параметры: duration, interval, length, color
 */
const getArgs = () => {
  const result = {};
  for (const [arg, config] of Object.entries(ARGUMENT_MAP)) {
    result[config.name] = config.defaultValue;
  }
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const config = ARGUMENT_MAP[arg];

    if (config && i + 1 < process.argv.length) {
      const value = process.argv[i + 1];
      const validatedValue = config.validatedValue(value);

      if (validatedValue !== null) {
        result[config.name] = validatedValue;
      }
      i++;
    }
  }
  return result;
};
/**
 * Функция показывает кастомный прогресс-бар в консоли по заданным параметра
 *
 * Параметры:
 * --duration - время выполнения в мс (по умолчанию 5000)
 * --interval - частота обновления в мс (по умолчанию 100)
 * --length - длина полосы в символах (по умолчанию 30)
 * --color - цвет заполненной части в формате #RRGGBB (необязательно)
 *
 * Цвет обязательно нужно передавать в кавычках, например --color "#FF5733"
 *
 * @example
 * node progress.js --duration 3000 --color "#00FF00"
 */
const progress = () => {
  const { duration, interval, length, color } = getArgs();
  const steps = duration / interval;
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep++;

    const percent = Math.min(Math.round((currentStep / steps) * 100), 100);

    const filledLength = Math.floor((percent / 100) * length);
    const emptyLength = length - filledLength;

    const filledPart = "█".repeat(filledLength);
    const coloredFilled = color
      ? colorProgressBar(filledPart, color)
      : filledPart;
    const emptyPart = " ".repeat(emptyLength);

    const bar = `\r[${coloredFilled}${emptyPart}] ${percent}%`;
    process.stdout.write(bar);

    if (currentStep >= steps) {
      clearInterval(timer);
      console.log("\nDone!");
    }
  }, interval);
};

progress();
