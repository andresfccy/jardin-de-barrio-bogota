import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "site");
const output = resolve(root, "dist");

if (!existsSync(source)) {
  throw new Error("No existe el directorio site/");
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(source, output, { recursive: true });
console.log("Sitio construido en dist/");
