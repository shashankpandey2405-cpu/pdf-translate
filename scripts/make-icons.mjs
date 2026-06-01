import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const iconPath = path.join(publicDir, "icon.png");
const logoPath = path.join(publicDir, "logo.png");

/** Nearest-neighbor resize (RGBA). */
function resizePng(src, outW, outH) {
  const dst = new PNG({ width: outW, height: outH });
  const sx = src.width / outW;
  const sy = src.height / outH;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const sx0 = Math.min(Math.floor(x * sx), src.width - 1);
      const sy0 = Math.min(Math.floor(y * sy), src.height - 1);
      const si = (sx0 + sy0 * src.width) << 2;
      const di = (x + y * outW) << 2;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  return dst;
}

/** Fallback placeholder when no public/logo.png or public/icon.png yet. */
function pngRoundedSquare(size) {
  const png = new PNG({ width: size, height: size });
  const cornerR = Math.max(8, Math.round(size * 0.2));
  const R = 255;
  const G = 60;
  const B = 0;

  function insideRoundedRect(px, py) {
    const w = size;
    const h = size;
    const r = cornerR;
    if (px < r && py < r) {
      const cx = r;
      const cy = r;
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    }
    if (px >= w - r && py < r) {
      const cx = w - r;
      const cy = r;
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    }
    if (px < r && py >= h - r) {
      const cx = r;
      const cy = h - r;
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    }
    if (px >= w - r && py >= h - r) {
      const cx = w - r;
      const cy = h - r;
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    }
    return px >= 0 && px < w && py >= 0 && py < h;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      if (insideRoundedRect(x, y)) {
        png.data[idx] = R;
        png.data[idx + 1] = G;
        png.data[idx + 2] = B;
        png.data[idx + 3] = 255;
      } else {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }
  return png;
}

async function writePng(filePath, pngInstance) {
  await fs.writeFile(filePath, PNG.sync.write(pngInstance));
}

async function main() {
  await fs.mkdir(publicDir, { recursive: true });

  let base;
  let preserveLogoPng = false;
  try {
    const buf = await fs.readFile(logoPath);
    base = PNG.sync.read(buf);
    preserveLogoPng = true;
    console.log(`✓ Using brand source: public/logo.png (${base.width}×${base.height})`);
  } catch {
    try {
      const buf = await fs.readFile(iconPath);
      base = PNG.sync.read(buf);
      console.log(`✓ Using brand source: public/icon.png (${base.width}×${base.height})`);
    } catch {
      const gen512 = pngRoundedSquare(512);
      await writePng(iconPath, gen512);
      base = gen512;
      console.log("✓ Created default public/icon.png (add your logo file to replace it)");
    }
  }

  const icon192 = resizePng(base, 192, 192);
  const icon512 = resizePng(base, 512, 512);
  const apple180 = resizePng(base, 180, 180);

  const logo96 = resizePng(base, 96, 96);
  const logo192 = resizePng(base, 192, 192);

  await writePng(path.join(publicDir, "icon-192.png"), icon192);
  await writePng(path.join(publicDir, "icon-512.png"), icon512);
  await writePng(path.join(publicDir, "apple-touch-icon.png"), apple180);
  await writePng(path.join(publicDir, "Icon.png"), icon512);
  /** Nav/footer/PWA shell — never ship multi-MB source PNG as logo.png */
  await writePng(path.join(publicDir, "logo-96.png"), logo96);
  await writePng(path.join(publicDir, "logo-192.png"), logo192);
  await writePng(logoPath, logo192);

  const logoKb = Math.round(PNG.sync.write(logo192).length / 1024);
  console.log(
    `✓ Wrote icon-192/512, apple-touch-icon, Icon.png, logo-96.png, logo-192.png, logo.png (~${logoKb} KiB)${preserveLogoPng ? " (resized from brand source)" : ""}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
