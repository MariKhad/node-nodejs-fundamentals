import { parentPort } from "worker_threads";

/**
 * Получает объект с chunk (массив чисел) и index от главного потока,
 * сортирует числа по возрастанию и отправляет обратно на обработку
 */
parentPort.on("message", (data) => {
  try {
    if (!data || typeof data !== "object") {
      throw new Error("Expected object with chunk and index");
    }

    const { chunk, index } = data;

    if (!Array.isArray(chunk)) {
      throw new Error("Chunk must be an array");
    }

    const sorted = chunk.sort((a, b) => a - b);

    parentPort.postMessage({
      index: index,
      sorted: sorted,
    });
    parentPort.close();
  } catch (err) {
    parentPort.postMessage({
      index: data?.index ?? -1,
      error: err.message,
    });
    parentPort.close(1);
  }
});
