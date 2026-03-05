import { Worker } from "worker_threads";

const main = async () => {
  const worker = new Worker("./worker.js");

  //worker.postMessage("Ghbdtn");

  worker.postMessage([5, 3, 8, 1, 9, 10, 6, 7]);
  worker.on("message", (result) => {
    console.log(result);
    worker.terminate();
  });
};

await main();
