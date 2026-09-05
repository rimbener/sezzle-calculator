import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// AC-9: the domain runs with no HTTP present. Every domain module, tests included,
// imports only the contract, vitest or a sibling. Listing the domain keeps the HTTP
// layer beside it out of the scan.
const SRC = join(import.meta.dirname, ".");
const DOMAIN = [
  "operations",
  "calculate.ts",
  "calculate.test.ts",
  "calculation-error.ts",
];
const ALLOWED = ["@repo/contracts", "vitest"];

const tsFilesUnder = (path: string): string[] => {
  if (!statSync(path).isDirectory()) return path.endsWith(".ts") ? [path] : [];
  return readdirSync(path).flatMap((name) => tsFilesUnder(join(path, name)));
};

const importSpecifiers = (source: string): string[] =>
  [...source.matchAll(/^import\b[^"']*["']([^"']+)["']/gm)].map(
    (match) => match[1] as string,
  );

describe("calculation domain (AC-9)", () => {
  const files = DOMAIN.flatMap((entry) => tsFilesUnder(join(SRC, entry)));

  it("names every domain module", () => {
    expect(files.length).toBeGreaterThan(DOMAIN.length);
    expect(files).toContain(join(SRC, "operations", "registry.ts"));
  });

  it("has no HTTP anywhere: every import is the contract, vitest or a sibling module", () => {
    for (const file of files) {
      const foreign = importSpecifiers(readFileSync(file, "utf8")).filter(
        (specifier) =>
          !specifier.startsWith(".") && !ALLOWED.includes(specifier),
      );
      expect(foreign, `${file} imports ${foreign.join(", ")}`).toEqual([]);
    }
  });
});
