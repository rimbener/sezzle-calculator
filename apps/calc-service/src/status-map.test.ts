import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// p2 AC-3: `STATUS_BY_CODE` is the contract's and the only such map in the repo.
// This service used to declare its own; every workspace's `src/` is scanned so
// neither it nor a sibling grows one back.
const ROOT = join(import.meta.dirname, "..", "..", "..");
const CONTRACT_MAP = join("packages", "contracts", "src", "errors.ts");

const tsFilesUnder = (path: string): string[] => {
  if (!statSync(path).isDirectory()) return path.endsWith(".ts") ? [path] : [];
  return readdirSync(path)
    .filter((name) => name !== "node_modules")
    .flatMap((name) => tsFilesUnder(join(path, name)));
};

const workspaceSources = (): string[] =>
  ["apps", "packages"].flatMap((group) =>
    readdirSync(join(ROOT, group)).flatMap((workspace) => {
      const src = join(ROOT, group, workspace, "src");
      try {
        return tsFilesUnder(src);
      } catch {
        return [];
      }
    }),
  );

describe("STATUS_BY_CODE — one map in the whole repo (p2 AC-3)", () => {
  it("is declared in the contract and nowhere else", () => {
    const declaring = workspaceSources()
      .filter((file) =>
        /\b(const|let|var)\s+STATUS_BY_CODE\b/.test(readFileSync(file, "utf8")),
      )
      .map((file) => relative(ROOT, file));

    expect(declaring).toEqual([CONTRACT_MAP]);
  });
});
