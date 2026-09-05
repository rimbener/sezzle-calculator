import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// AC-12, the structural half: the gateway computes nothing. No module under
// `src/` imports calc-service code or an operation implementation, and none
// reaches for `Math`. The behavioural half — a fake's implausible number comes
// back unchanged, and nothing yields a result while the fake fails — is in
// `app.test.ts`.
const SRC = join(import.meta.dirname, ".");
const ALLOWED = ["@repo/contracts", "@hono/node-server", "vitest"];
const ALLOWED_PREFIXES = ["hono", "node:", "vitest/"];

const tsFilesUnder = (path: string): string[] => {
  if (!statSync(path).isDirectory()) return path.endsWith(".ts") ? [path] : [];
  return readdirSync(path).flatMap((name) => tsFilesUnder(join(path, name)));
};

const importSpecifiers = (source: string): string[] =>
  [...source.matchAll(/^import\b[^"']*["']([^"']+)["']/gm)].map(
    (match) => match[1] as string,
  );

const isAllowedPackage = (specifier: string): boolean =>
  ALLOWED.includes(specifier) ||
  ALLOWED_PREFIXES.some(
    (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
  ) ||
  specifier.startsWith("node:");

/** A relative import that stays inside `src/`. */
const isSibling = (file: string, specifier: string): boolean =>
  specifier.startsWith(".") &&
  !relative(SRC, join(file, "..", specifier)).startsWith("..");

describe("the gateway computes nothing (AC-12)", () => {
  const files = tsFilesUnder(SRC);

  it("scans every module of the service", () => {
    expect(files).toContain(join(SRC, "app.ts"));
    expect(files).toContain(join(SRC, "calc-client.ts"));
  });

  it("imports no calc-service code and no operation implementation: every import is the contract, Hono, Node, vitest or a sibling module", () => {
    for (const file of files) {
      const foreign = importSpecifiers(readFileSync(file, "utf8")).filter(
        (specifier) =>
          !isAllowedPackage(specifier) && !isSibling(file, specifier),
      );
      expect(foreign, `${file} imports ${foreign.join(", ")}`).toEqual([]);
    }
  });

  it("implements no arithmetic: no module reaches for Math", () => {
    for (const file of files) {
      expect(
        readFileSync(file, "utf8"),
        `${relative(SRC, file)} uses Math`,
      ).not.toMatch(/\bMath\s*\./);
    }
  });
});
