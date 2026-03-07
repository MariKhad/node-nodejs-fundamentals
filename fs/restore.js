import fs from "fs/promises";
import path from "path";

/**
 * Восстанавливает файлы и папки из snapshot.json в папке workspace_restored
 * Папка workspace_restored создается в рабочей директории
 */

const restore = async () => {
  let rawSnapshotPath = process.argv[2]?.replace(/^"|"$/g, "");

  if (!rawSnapshotPath) {
    throw new Error("Path to snapshot is required");
  }

  const snapshotPath = path.resolve(rawSnapshotPath);

  const restoreBaseDir = path.join(process.cwd(), "workspace_restored");

  try {
    await fs.access(restoreBaseDir);
    console.error(`Folder already exists: ${restoreBaseDir}`);
    throw new Error(`Folder already exists: ${restoreBaseDir}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error("FS operation failed");
    }
  }

  try {
    await fs.access(snapshotPath);

    const snapshotStats = await fs.stat(snapshotPath);
    if (!snapshotStats.isFile()) {
      throw new Error("Path points to a DIRECTORY, but FILE is required");
    }

    const data = await fs.readFile(snapshotPath, "utf8");
    const snapshot = JSON.parse(data);

    if (!snapshot.entries || !Array.isArray(snapshot.entries)) {
      throw new Error("The snapshot is incorrect");
    }

    await fs.mkdir(restoreBaseDir, { recursive: true });

    for (const entry of snapshot.entries) {
      const fullRestorePath = path.join(restoreBaseDir, entry.path);

      if (entry.type === "directory") {
        await fs.mkdir(fullRestorePath, { recursive: true });
        console.log(`Created directory: ${entry.path}`);
      } else if (entry.type === "file") {
        const parentDir = path.dirname(fullRestorePath);
        await fs.mkdir(parentDir, { recursive: true });

        const fileContent = Buffer.from(entry.content, "base64");
        await fs.writeFile(fullRestorePath, fileContent);
      }
    }

    console.log(`Restore completed successfully!`);
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error("Path does not exist:", rowSnapshotPath);
    }
    throw new Error(`FS operation failed: ${error?.message || ""}`);
  }
};

await restore();
