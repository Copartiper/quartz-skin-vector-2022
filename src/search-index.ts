import fs from "node:fs/promises";
import path from "node:path";
import type { FilePath, QuartzEmitterPlugin } from "@quartz-community/types";

/** Lightweight suggestions deliberately exclude full page content. */
export const VectorSearchIndex: QuartzEmitterPlugin = () => ({
  name: "VectorSearchIndex",
  async emit(ctx, content) {
    const pages = content.map(([, file]) => ({
      slug: file.data.slug,
      title: file.data.frontmatter?.title ?? file.data.slug ?? "",
      description: file.data.frontmatter?.description ?? file.data.description ?? "",
    }));
    const output = path.join(ctx.argv.output, "static/vector-search.json") as FilePath;
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(pages));
    return [output];
  },
});
