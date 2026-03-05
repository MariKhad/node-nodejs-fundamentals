import { parentPort } from "worker_threads";

/**
 * Получает массив чисел от главного потока,
 * сортирует их по возрастанию и отправляет обратно
 */
parentPort.on("message", (data) => {
  try {
    if (!Array.isArray(data)) {
      throw new Error("Expected array of numbers");
    }

    const sorted = data.sort((a, b) => a - b);

    parentPort.postMessage(sorted);
  } catch (err) {
    parentPort.postMessage({ error: err.message });
  }
});
