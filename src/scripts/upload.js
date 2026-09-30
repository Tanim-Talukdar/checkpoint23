const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

/*
|--------------------------------------------------------------------------
| Project root
|--------------------------------------------------------------------------
| upload.js is inside: src/scripts/
| So we go two levels up to reach the project root.
*/
const projectRoot = path.resolve(__dirname, "../..");

/*
|--------------------------------------------------------------------------
| Load .env.local
|--------------------------------------------------------------------------
*/

const envPath = path.join(projectRoot, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error(".env.local not found:");
  console.error(envPath);
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, "utf8");

for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) continue;

  const equalIndex = trimmed.indexOf("=");

  if (equalIndex === -1) continue;

  const key = trimmed.slice(0, equalIndex).trim();
  const value = trimmed
    .slice(equalIndex + 1)
    .trim()
    .replace(/^["']|["']$/g, "");

  process.env[key] = value;
}

/*
|--------------------------------------------------------------------------
| Cloudinary configuration
|--------------------------------------------------------------------------
*/

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
|--------------------------------------------------------------------------
| Image folder
|--------------------------------------------------------------------------
*/

const folderPath = path.join(
  projectRoot,
  "public",
  "Checkpoint-Pictures-Optimized",
  "gym&steamBath"
);

/*
|--------------------------------------------------------------------------
| Output file
|--------------------------------------------------------------------------
*/

const outputPath = path.join(projectRoot, "cloudinary-links.txt");

const allowedExtensions = [
  ".webp",
  ".jpg",
  ".jpeg",
  ".png",
  ".avif",
];

async function main() {
  if (!fs.existsSync(folderPath)) {
    console.error("Image folder not found:");
    console.error(folderPath);
    process.exit(1);
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((file) =>
      allowedExtensions.includes(path.extname(file).toLowerCase())
    )
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log("No images found.");
    return;
  }

  console.log(`Found ${files.length} images.`);
  console.log("");

  const links = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    try {
      console.log(`Uploading: ${file}`);

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "Checkpoint/gym-steamBath",
        resource_type: "image",
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      });

      const line = `"link","${result.secure_url}"`;

      links.push(line);

      console.log(`Done: ${result.secure_url}`);
      console.log("");
    } catch (error) {
      console.error(`FAILED: ${file}`);
      console.error(error.message);
      console.log("");
    }
  }

  fs.writeFileSync(outputPath, links.join("\n"), "utf8");

  console.log("--------------------------------");
  console.log(`Uploaded: ${links.length}/${files.length}`);
  console.log(`Links saved to: ${outputPath}`);
  console.log("--------------------------------");
}

main();