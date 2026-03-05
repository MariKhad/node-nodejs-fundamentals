import fs from "fs/promises";
import path from "path";

const scanDirectory = async (currentPath, relativePath = "", entries = []) => {
  const items = await fs.readdir(currentPath);

  for (const item of items) {
    const fullPath = path.join(currentPath, item);
    const itemStats = await fs.stat(fullPath);

    if (itemStats.isDirectory()) {
      entries.push({
        path: path.join(relativePath, item),
        type: "directory",
      });

      const subEntries = await scanDirectory(
        fullPath,
        path.join(relativePath, item),
      );

      entries.push(...subEntries);
    } else {
      const content = await fs.readFile(fullPath);

      entries.push({
        path: path.join(relativePath, item),
        type: "file",
        size: itemStats.size,
        content: content.toString("base64"),
      });
    }
  }

  return entries;
};

const snapshot = async () => {
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

    console.log(`Scanning of ${workspacePath} starts...`);
    const entries = await scanDirectory(workspacePath, "");

    const snapshotData = {
      rootPath: workspacePath,
      entries: entries,
    };

    console.log(`Found ${snapshotData.entries.length} items`);

    const jsonContent = JSON.stringify(snapshotData, null, 2);

    const outputPath = path.join(workspacePath, "snapshot.json");

    await fs.writeFile(outputPath, jsonContent, "utf8");

    console.log(`Snapshot saved to: ${outputPath}`);
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error("Path does not exist:", workspacePath);
    } else if (error?.code === "EACCES") {
      console.error("No permission to access:", workspacePath);
    }
    throw new Error(`FS operation failed: ${error?.message || ""}`);
  }
};

await snapshot();
