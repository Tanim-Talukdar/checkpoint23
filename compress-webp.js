const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE_DIR = path.join(
  process.cwd(),
  "public",
  "Checkpoint-Pictures"
);

const OUTPUT_DIR = path.join(
  process.cwd(),
  "public",
  "Checkpoint-Pictures-Optimized"
);

// Image settings
const MAX_SIZE = 1600;

// We try to keep images around this range.
const MIN_KB = 175;
const MAX_KB = 250;

// Quality limits.
// Higher = better quality / larger file.
const START_QUALITY = 85;
const MIN_QUALITY = 55;

const EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;

async function compressImage(inputPath, outputPath) {
  let quality = START_QUALITY;
  let buffer;

  // Try different qualities until the image is in the desired size range.
  while (quality >= MIN_QUALITY) {
    buffer = await sharp(inputPath)
      .rotate()
      .resize({
        width: MAX_SIZE,
        height: MAX_SIZE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 6,
      })
      .toBuffer();

    const sizeKB = buffer.length / 1024;

    if (sizeKB <= MAX_KB) {
      break;
    }

    quality -= 5;
  }

  await fs.promises.writeFile(outputPath, buffer);

  return {
    sizeKB: buffer.length / 1024,
    quality,
  };
}

async function processFolder(sourceFolder, relativeFolder = "") {
  const entries = await fs.promises.readdir(sourceFolder, {
    withFileTypes: true,
  });

  const imageFiles = entries
    .filter(
      (entry) =>
        entry.isFile() && EXTENSIONS.test(entry.name)
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
      })
    );

  if (imageFiles.length > 0) {
    const outputFolder = path.join(
      OUTPUT_DIR,
      relativeFolder
    );

    await fs.promises.mkdir(outputFolder, {
      recursive: true,
    });

    let number = 1;

    for (const file of imageFiles) {
      const inputPath = path.join(
        sourceFolder,
        file.name
      );

      const outputName =
        `${String(number).padStart(2, "0")}.webp`;

      const outputPath = path.join(
        outputFolder,
        outputName
      );

      try {
        const result = await compressImage(
          inputPath,
          outputPath
        );

        console.log(
          `✓ ${relativeFolder}/${file.name}` +
          ` → ${relativeFolder}/${outputName}` +
          ` | ${result.sizeKB.toFixed(0)} KB` +
          ` | quality ${result.quality}`
        );

        number++;
      } catch (error) {
        console.error(
          `✗ Failed: ${inputPath}`
        );
        console.error(error.message);
      }
    }
  }

  // Process subfolders
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await processFolder(
        path.join(sourceFolder, entry.name),
        path.join(relativeFolder, entry.name)
      );
    }
  }
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(
      `Source folder not found:\n${SOURCE_DIR}`
    );
    process.exit(1);
  }

  // Delete previous optimized output
  if (fs.existsSync(OUTPUT_DIR)) {
    await fs.promises.rm(OUTPUT_DIR, {
      recursive: true,
      force: true,
    });
  }

  await fs.promises.mkdir(OUTPUT_DIR, {
    recursive: true,
  });

  console.log("====================================");
  console.log("Checkpoint Image Optimization");
  console.log("====================================");
  console.log(`Max size: ${MAX_SIZE}px`);
  console.log(`Target: ${MIN_KB}-${MAX_KB} KB`);
  console.log("Format: WebP");
  console.log("====================================\n");

  await processFolder(SOURCE_DIR);

  console.log("\n====================================");
  console.log("✓ DONE");
  console.log("====================================");
  console.log(
    `Output folder:\n${OUTPUT_DIR}`
  );
}

main().catch((error) => {
  console.error("\nERROR:");
  console.error(error);
  process.exit(1);
});