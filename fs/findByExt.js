import fs from "fs/promises";
import path from "path";

const findExt = () => {
  let ext = ".txt";

  const extIndex = process.argv.indexOf("--ext");

  if (extIndex !== -1 && extIndex + 1 < process.argv.length) {
    let argExt = process.argv[extIndex + 1];

    if (!argExt.startsWith(".")) {
      ext = "." + argExt;
    } else {
      ext = argExt;
    }
  }
  return ext;
};

const findFilesByExt = async (
  currentPath,
  extension,
  relativePath = "",
  foundFiles = [],
) => {
  try {
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await findFilesByExt(
          fullPath,
          extension,
          path.join(relativePath, item),
          foundFiles,
        );
      } else if (stats.isFile() && item.endsWith(extension)) {
        foundFiles.push(path.join(relativePath, item));
      }
    }

    return foundFiles;
  } catch (e) {
    console.error(`Error reading ${currentPath}:`, error.message);
  }
};

const findByExt = async () => {
  let rowWorkspacePath = process.argv[2]?.replace(/^"|"$/g, "");

  if (!rowWorkspacePath) {
    throw new Error("Workspace path is required");
  }
  const workspacePath = path.resolve(rowWorkspacePath);

  try {
    await fs.access(workspacePath);
    const stats = await fs.stat(workspacePath);

    if (!stats.isDirectory()) {
      throw new Error("Path points to a FILE, but DIRECTORY is required");
    }

    const ext = findExt();

    console.log(`Scanning of ${workspacePath} starts...`);

    const foundFiles = await findFilesByExt(workspacePath, ext, "");

    if (!foundFiles.length) {
      console.log(
        `No files with the extension ${ext} were found in the specified directory.`,
      );

      return;
    }

    foundFiles.sort();

    for (const filePath of foundFiles) {
      console.log(filePath);
    }

    return;
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error("Path does not exist:", workspacePath);
    } else if (error?.code === "EACCES") {
      console.error("No permission to access:", workspacePath);
    }
    throw new Error(`FS operation failed: ${error?.message || ""}`);
  }
};

await findByExt();
