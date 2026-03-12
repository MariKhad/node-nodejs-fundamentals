# Node.js Fundamentals

## Description

This repository contains solutions for Node.js Fundamentals assignment. The assignment covers various Node.js core APIs including File System, CLI, Modules, Hash, Streams, Zlib, Worker Threads, and Child Processes.

## Getting Started

1. **Fork this repository**

   Click the "Fork" button at the top right of this page: https://github.com/AlreadyBored/node-nodejs-fundamentals

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/node-nodejs-fundamentals.git
   cd node-nodejs-fundamentals
   ```

3. **Install dependencies** (if any added in the future)

   ```bash
   npm install
   ```

4. **Start implementing the tasks**

   Each file in the `src/` directory contains a function template with comments describing what needs to be implemented.

## Requirements

- Node.js version: >=24.10.0
- npm version: >=10.9.2
- No external libraries allowed

## Usage

### File System (src/fs)

- `npm run fs:snapshot` - Create snapshot of workspace directory
- `npm run fs:restore` - Restore directory structure from snapshot
- `npm run fs:findByExt` - Find files by extension in workspace
- `npm run fs:merge` - Merge .txt files from workspace/parts
- `npm run fs:merge -- --files a.txt,b.txt,c.txt` - Merge specific files from workspace/parts in provided order

Snapshot format reminder:

```json
{
  "rootPath": "/absolute/path/to/workspace",
  "entries": [
    { "path": "file1.txt", "type": "file", "size": 1024, "content": "base64" },
    { "path": "nested", "type": "directory" }
  ]
}
```

`entries[].path` values must be relative to `workspace`.

### CLI (src/cli)

- `npm run cli:interactive` - Interactive command-line interface
- `npm run cli:progress` - Display progress bar

### Modules (src/modules)

- `npm run modules:dynamic` - Dynamic plugin loading

### Hash (src/hash)

- `npm run hash:verify` - Verify file checksums using SHA256

### Streams (src/streams)

- `npm run streams:lineNumberer` - Add line numbers to stdin input
- `npm run streams:filter` - Filter stdin lines by pattern
- `npm run streams:split` - Split file into chunks

### Zlib (src/zip)

- `npm run zip:compressDir` - Compress directory to .br archive
- `npm run zip:decompressDir` - Decompress .br archive

### Worker Threads (src/wt)

- `npm run wt:main` - Parallel sorting with worker threads

### Child Processes (src/cp)

- `npm run cp:execCommand` - Execute command in child process

## Submission

1. Implement all the required functionality in the corresponding files
2. Test your solutions using the npm scripts provided
3. Commit your changes to your forked repository
4. Submit the link to your repository for review

## !!! Please don't submit Pull Requests to this repository !!!
