import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Architecture test: enforce Typesense{Domain}Service naming convention.
 *
 * All Typesense service ports must be named `Typesense{Domain}ServicePort`.
 * All Typesense service implementations must be named `Typesense{Domain}Service`.
 * Reversed naming like `{Domain}TypesenseService` is forbidden.
 */

const PORTS_DIR = join(__dirname, "../../src/shared/ports");
const TYPESENSE_SERVICE_DIR = join(
  __dirname,
  "../../src/shared/infrastructure/typesense.service",
);

/** Extract exported interface/class names from a file */
async function getExportedNames(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, "utf-8");
  const matches = content.matchAll(
    /export\s+(?:interface|class|type)\s+(\w+)/g,
  );
  return [...matches].map((m) => m[1]!).filter(Boolean);
}

describe("Architecture: Typesense Naming Convention", () => {
  it("all Typesense service ports follow Typesense{Domain}ServicePort pattern", async () => {
    const files = await readdir(PORTS_DIR);
    const typesensePortFiles = files.filter(
      (f) => f.includes("typesense") && f.endsWith(".port.ts"),
    );

    const violations: string[] = [];

    for (const file of typesensePortFiles) {
      const names = await getExportedNames(join(PORTS_DIR, file));
      for (const name of names) {
        if (name.endsWith("ServicePort") && !name.startsWith("Typesense")) {
          violations.push(`${file}: "${name}" should start with "Typesense"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("all Typesense service implementations follow Typesense{Domain}Service pattern", async () => {
    const files = await readdir(TYPESENSE_SERVICE_DIR);
    const serviceFiles = files.filter(
      (f) => f.endsWith(".service.ts") && !f.endsWith(".port.ts"),
    );

    const violations: string[] = [];

    for (const file of serviceFiles) {
      const names = await getExportedNames(join(TYPESENSE_SERVICE_DIR, file));
      for (const name of names) {
        if (
          name.endsWith("Service") &&
          !name.endsWith("ServicePort") &&
          !name.startsWith("Typesense")
        ) {
          violations.push(`${file}: "${name}" should start with "Typesense"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("no reversed naming like {Domain}TypesenseService exists", async () => {
    const portFiles = await readdir(PORTS_DIR);
    const serviceFiles = await readdir(TYPESENSE_SERVICE_DIR);

    const allFiles = [
      ...portFiles
        .filter((f) => f.includes("typesense"))
        .map((f) => join(PORTS_DIR, f)),
      ...serviceFiles
        .filter((f) => f.endsWith(".service.ts"))
        .map((f) => join(TYPESENSE_SERVICE_DIR, f)),
    ];

    const violations: string[] = [];
    const reversedPattern = /^[A-Z][a-z]+TypesenseService/;

    for (const filePath of allFiles) {
      const names = await getExportedNames(filePath);
      for (const name of names) {
        if (reversedPattern.test(name)) {
          violations.push(
            `"${name}" uses reversed naming — should be Typesense{Domain}Service`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
