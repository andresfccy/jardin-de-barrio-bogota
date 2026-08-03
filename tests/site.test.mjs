import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

test("construye los activos principales", () => {
  assert.ok(existsSync(new URL("../dist/assets/styles.css", import.meta.url)));
  assert.ok(existsSync(new URL("../dist/assets/app.js", import.meta.url)));
});

test("incluye todas las áreas del estudio", () => {
  for (const id of [
    "resumen", "mercado", "regulacion", "inmueble", "equipo",
    "finanzas", "ruta", "operacion", "riesgos", "fuentes",
  ]) {
    assert.match(html, new RegExp(`id=[\"']${id}[\"']`));
  }
});

test("mantiene advertencias y trazabilidad", () => {
  assert.match(html, /estudio preliminar/i);
  assert.match(html, /No firmar/i);
  assert.match(html, /3 de agosto de 2026/i);
  assert.match(html, /SIRSS/);
});
