import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteRoot = path.resolve(__dirname, "..");
const distRoot = path.join(websiteRoot, "dist");

function extractAssetTags(template) {
  const stylesheetTags = template.match(/<link rel="stylesheet"[^>]*>/g) ?? [];
  const scriptTags = template.match(/<script type="module"[\s\S]*?<\/script>/g) ?? [];

  return [...stylesheetTags, ...scriptTags].join("\n    ");
}

function buildDocument({ appHtml, assetTags, seoHead }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${seoHead}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    ${assetTags}
  </head>
  <body>
    <div id="root">${appHtml}</div>
  </body>
</html>
`;
}

async function main() {
  const template = await fs.readFile(path.join(distRoot, "index.html"), "utf8");
  const assetTags = extractAssetTags(template);

  const viteServer = await createServer({
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    appType: "custom",
    server: {
      middlewareMode: true,
    },
    root: websiteRoot,
  });

  try {
    const [{ publicSitePaths }, { getMarketingSeo }, { renderSeoHead }, { renderMarketingRoute }] =
      await Promise.all([
        viteServer.ssrLoadModule("/src/app/lib/site.ts"),
        viteServer.ssrLoadModule("/src/app/lib/route-seo.ts"),
        viteServer.ssrLoadModule("/src/app/lib/seo.ts"),
        viteServer.ssrLoadModule("/src/app/entry-marketing-server.tsx"),
      ]);

    for (const routePath of publicSitePaths) {
      const appHtml = renderMarketingRoute(routePath);
      const seoHead = renderSeoHead({
        ...getMarketingSeo(routePath),
        path: routePath,
      });
      const outputHtml = buildDocument({ appHtml, assetTags, seoHead });
      const outputDir =
        routePath === "/" ? distRoot : path.join(distRoot, routePath.replace(/^\/+/, ""));

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(path.join(outputDir, "index.html"), outputHtml, "utf8");
    }
  } finally {
    await viteServer.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
