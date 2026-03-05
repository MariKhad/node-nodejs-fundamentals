import fs from "fs/promises";
import path from "path";

const parseFilesOrder = () => {
  let filesOrder = [];

  const filesIndex = process.argv.indexOf("--files");

  if (filesIndex !== -1 && filesIndex + 1 < process.argv.length) {
    let argFiles = process.argv[filesIndex + 1];

    filesOrder = argFiles.split(",");
  }
  return filesOrder;
};

const validateFilesExist = async (partsPath, files) => {
  const missingFiles = [];
  const invalidExtFiles = [];

  for (const file of files) {
    if (path.extname(file).toLowerCase() !== ".txt") {
      invalidExtFiles.push(file);
      continue;
    }

    try {
      await fs.access(path.join(partsPath, file));
    } catch {
      missingFiles.push(file);
    }
  }

  if (invalidExtFiles.length > 0 || missingFiles.length > 0) {
    let errorMessage = "";

    if (invalidExtFiles.length > 0) {
      errorMessage += `\n  Invalid Extention ${invalidExtFiles.join(", ")} (.txt is needed)`;
    }

    if (missingFiles.length > 0) {
      errorMessage += `\n  Files missing: ${missingFiles.join(", ")}`;
    }

    throw new Error(errorMessage);
  }

  return true;
};

const getWorkspacePath = () => {
  let workspacePath = process.cwd();
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (!arg.startsWith("--") && process.argv[i - 1] !== "--files") {
      workspacePath = arg.replace(/^"|"$/g, "");
      break;
    }
  }

  return workspacePath;
};

const merge = async () => {
  let workspacePath = getWorkspacePath();

  const customFiles = parseFilesOrder();
  const useCustomOrder = customFiles.length > 0;

  const partsDirPath = path.join(workspacePath, "parts");

  try {
    await fs.access(partsDirPath);
    const allFiles = await fs.readdir(partsDirPath);
    let filesToMerge = [];
    let mergedContent = "";

    if (useCustomOrder) {
      await validateFilesExist(partsDirPath, customFiles);

      filesToMerge = customFiles;
    } else {
      filesToMerge = allFiles
        .filter((file) => path.extname(file).toLowerCase() === ".txt")
        .sort();
      if (filesToMerge.length < 1) {
        throw new Error("There is no txt files in the directory");
      }
    }

    for (const file of filesToMerge) {
      const filePath = path.join(partsDirPath, file);

      const stats = await fs.stat(filePath);

      const content = await fs.readFile(path.join(partsDirPath, file), {
        encoding: "utf8",
      });

      if (stats.size === 0) {
        console.log(`Файл ${file} имеет нулевой размер!`);
      }

      mergedContent += content + "\n\n";

      mergedContent;
    }
    await fs.writeFile(path.join(workspacePath, "merged.txt"), mergedContent);
    return;
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error("Path does not exist:", partsDirPath);
    } else if (error?.code === "EACCES") {
      console.error("No permission to access:", partsDirPath);
    }
    throw new Error(`FS operation failed: ${error?.message || ""}`);
  }
};

await merge();
