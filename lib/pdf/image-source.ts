import fs from "fs";
import path from "path";

const cache = new Map<string, string | null>();

function mimeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export function imageSourceFromAbsolute(filePath?: string | null): string | null {
  if (!filePath) return null;
  if (cache.has(filePath)) return cache.get(filePath) ?? null;

  try {
    if (!fs.existsSync(filePath)) {
      cache.set(filePath, null);
      return null;
    }
    const buffer = fs.readFileSync(filePath);
    const source = `data:${mimeFromPath(filePath)};base64,${buffer.toString("base64")}`;
    cache.set(filePath, source);
    return source;
  } catch {
    cache.set(filePath, null);
    return null;
  }
}

export function imageSourceFromPublicPath(publicPath?: string): string | null {
  if (!publicPath) return null;
  const clean = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  const absolute = path.join(process.cwd(), "public", clean);
  return imageSourceFromAbsolute(absolute);
}

