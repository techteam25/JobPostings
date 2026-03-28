import { projectFiles } from "archunit";

describe("Architecture: Typesense Naming Convention", () => {
  // ─── File Naming (archunit) ──────────────────────────────────────────

  it("port files containing 'typesense' must start with 'typesense-'", async () => {
    const rule = projectFiles()
      .inFolder("src/shared/ports/**")
      .shouldNot()
      .haveName(/^(?!typesense)[a-z].*typesense.*\.port\.ts$/);

    await expect(rule).toPassAsync();
  });

  it("service files in typesense directory must start with 'typesense'", async () => {
    const rule = projectFiles()
      .inFolder("src/shared/infrastructure/typesense.service/**")
      .shouldNot()
      .haveName(/^(?!typesense)[a-z].*\.service\.ts$/);

    await expect(rule).toPassAsync();
  });

  it("no reversed {Domain}Typesense file naming in ports", async () => {
    const rule = projectFiles()
      .inFolder("src/shared/ports/**")
      .shouldNot()
      .haveName(/^[a-z]+-typesense.*\.port\.ts$/);

    await expect(rule).toPassAsync();
  });

  it("no reversed {Domain}Typesense file naming in services", async () => {
    const rule = projectFiles()
      .inFolder("src/shared/infrastructure/typesense.service/**")
      .shouldNot()
      .haveName(/^[a-z]+-typesense.*\.service\.ts$/);

    await expect(rule).toPassAsync();
  });
});
