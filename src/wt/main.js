import fs from "fs";
import os from "os";
import { Worker } from "worker_threads";

/**
 * Функция соединяющая отсортированные массивы с помощью метода указателей
 */
function mergeSortedArrays(arrays) {
  const result = [];
  const pointers = new Array(arrays.length).fill(0);

  while (true) {
    let minValue = Infinity;
    let minIndex = -1;

    for (let i = 0; i < arrays.length; i++) {
      if (pointers[i] < arrays[i].length && arrays[i][pointers[i]] < minValue) {
        minValue = arrays[i][pointers[i]];
        minIndex = i;
      }
    }

    if (minIndex === -1) break;

    result.push(minValue);
    pointers[minIndex]++;
  }

  return result;
}

/**
 * Основная функция которая создает воркеры по количеству ядер в компьтере
 * Разбивает пришедшую из json информацию на чанки
 * и отсылает в воркеры на обработку
 */
const main = async () => {
  if (!fs.existsSync("data.json")) {
    console.error("Файл data.json не найден!");
    return;
  }

  const numbers = JSON.parse(fs.readFileSync("data.json", "utf8"));
  const numCores = os.cpus().length;

  const chunkSize = Math.ceil(numbers.length / numCores);
  const chunks = [];
  const workers = [];

  for (let i = 0; i < numCores; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, numbers.length);
    if (start < numbers.length) {
      chunks.push(numbers.slice(start, end));
    }
  }

  const results = new Array(chunks.length);
  let completed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const worker = new Worker("./worker.js");
    workers.push(worker);

    worker.postMessage({
      chunk: chunks[i],
      index: i,
    });

    worker.on("message", (result) => {
      if (result.error) {
        worker.terminate();
        return;
      }

      results[result.index] = result.sorted;
      completed++;

      worker.terminate();

      if (completed === chunks.length) {
        const finalArray = mergeSortedArrays(results);
        console.log("Sorted array:", finalArray);
      }
    });

    worker.on("error", (err) => {
      console.error("Worker error:", err);
      worker.terminate();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.log(`Worker ${i} exited with code ${code}`);
      }
    });
  }
};

await main();
