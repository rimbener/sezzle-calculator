import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// AC-9: the calculation domain is exercisable with no HTTP present. Every module
// under src/ — sources and tests alike — imports only the contract, vitest, or
// each other. This file is the one exception (it needs the filesystem to look).
const SRC = join(import.meta.dirname, ".");
const SELF = "domain-purity.test.ts";
const ALLOWED = ["@repo/contracts", "vitest"];

const domainFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return domainFiles(path);
    return entry.name.endsWith(".ts") && entry.name !== SELF ? [path] : [];
  });

const importSpecifiers = (source: string): string[] =>
  [...source.matchAll(/^import\b[^"']*["']([^"']+)["']/gm)].map(
    (match) => match[1] as string,
  );

describe("calculation domain (AC-9)", () => {
  it("has no HTTP anywhere: every import is the contract, vitest or a sibling module", () => {
    const files = domainFiles(SRC);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const foreign = importSpecifiers(readFileSync(file, "utf8")).filter(
        (specifier) =>
          !specifier.startsWith(".") && !ALLOWED.includes(specifier),
      );
      expect(foreign, `${file} imports ${foreign.join(", ")}`).toEqual([]);
    }
  });
});
