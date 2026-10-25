import { expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { BuildCtx, ProcessedContent } from "@quartz-community/types";
import { VectorSearchIndex } from "../src/search-index";
it("emits only suggestion metadata, never full body content", async () => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "vector-index-"));
  try {
    const content = [
      [
        {},
        {
          data: {
            slug: "notes/page",
            frontmatter: { title: "A page", description: "A short summary" },
            text: "Secret body-only term",
          },
        },
      ],
    ] as unknown as ProcessedContent[];
    await VectorSearchIndex().emit({ argv: { output } } as BuildCtx, content, {} as never);
    const index = JSON.parse(
      await fs.readFile(path.join(output, "static/vector-search.json"), "utf8"),
    );
    expect(index).toEqual([
      { slug: "notes/page", title: "A page", description: "A short summary" },
    ]);
  } finally {
    await fs.rm(output, { recursive: true, force: true });
  }
});
