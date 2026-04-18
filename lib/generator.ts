import { Blueprint, Variables, Route, ContentPage } from "./types";
import { SEO_TEMPLATES, SEO_BUILDERS } from "./templates";

/**
 * Utilitaires de formatage et de nettoyage
 */

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBaseUrl(url: string = "") {
  return url.replace(/\/+$/, "");
}

function cleanArray<T>(arr: (T | undefined | null)[] = []): T[] {
  return arr.filter((item): item is T => {
    if (item === undefined || item === null) return false;
    if (typeof item === "string" && item.trim() === "") return false;
    return true;
  });
}

function xmlEscape(value: string | number = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function htmlEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function yamlEscape(value = "") {
  const str = String(value ?? "");
  return `"${str.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Moteur de remplacement de variables
 */
export function replaceVariables(value: any, vars: Record<string, any>): any {
  if (typeof value === "string") {
    return value.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => {
      return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
    });
  }
  if (Array.isArray(value)) {
    return value.map((v) => replaceVariables(v, vars));
  }
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, replaceVariables(val, vars)])
    );
  }
  return value;
}

/**
 * Générateurs de fichiers techniques
 */

function buildRobotsTxt(blueprint: Blueprint) {
  const config = blueprint.generatedFiles?.robotsTxt || {};
  const lines = [`User-agent: ${config.userAgent || "*"}`];
  
  cleanArray(config.allow || []).forEach(item => lines.push(`Allow: ${item}`));
  cleanArray(config.disallow || []).forEach(item => lines.push(`Disallow: ${item}`));
  lines.push("");
  cleanArray(config.sitemaps || []).forEach(item => lines.push(`Sitemap: ${item}`));
  
  return `${lines.join("\n")}\n`;
}

function buildSitemapIndex(blueprint: Blueprint) {
  const children = blueprint.sitemaps?.index?.children || [];
  const entries = cleanArray(children)
    .map(loc => `  <sitemap>\n    <loc>${xmlEscape(loc)}</loc>\n  </sitemap>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
}

function buildUrlSet(blueprint: Blueprint, routeNames: string[]) {
  const baseUrl = normalizeBaseUrl(blueprint.project?.baseUrl);
  const routes = (blueprint.routes || []).filter(r => routeNames.includes(r.name) && r.index !== false);
  
  const urls = routes.map(route => {
    const loc = `${baseUrl}${route.path.startsWith('/') ? route.path : `/${route.path}`}`;
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <changefreq>${xmlEscape(route.changefreq || "monthly")}</changefreq>\n    <priority>${xmlEscape(route.priority ?? 0.5)}</priority>\n  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Moteur de génération principal
 */
export function generateAllFiles(rawBlueprint: any, variables: Variables): Record<string, string> {
  const files: Record<string, string> = {};
  if (!rawBlueprint || !variables) return files;

  // Initialisation du blueprint avec injection des variables
  const blueprint: Blueprint = replaceVariables(rawBlueprint, variables) || {};
  if (!blueprint.project) blueprint.project = { baseUrl: "", siteName: "Site" };
  if (!blueprint.brand) blueprint.brand = { name: "Marque" };
  if (!blueprint.contentPages) blueprint.contentPages = [];
  if (!blueprint.routes) blueprint.routes = [];
  
  if (blueprint.project) {
    blueprint.project.baseUrl = normalizeBaseUrl(blueprint.project.baseUrl || "");
  }

  // 1. Pages de contenu JSON
  (blueprint.contentPages || []).forEach(page => {
    files[`content/${page.routeName || "index"}.json`] = JSON.stringify(page, null, 2);
  });

  // 2. Construction du Graph Global et Split des Schémas
  const globalGraph: any[] = [];
  const serviceGraph: any[] = [];
  const blogGraph: any[] = [];
  const breadcrumbGraph: any[] = [];
  
  // Home (Toujours dans global et home)
  const homeEntries = SEO_TEMPLATES.home(blueprint);
  globalGraph.push(...homeEntries);

  // Pages spécifiques
  (blueprint.contentPages || []).forEach(page => {
    const route = blueprint.routes?.find(r => r.name === page.routeName);
    const pType = page.pageType || route?.pageType || "";

    if (pType === 'service' || page.routeName?.includes('service')) {
      const g = SEO_TEMPLATES.service(blueprint, page, route);
      serviceGraph.push(...g);
      globalGraph.push(...g);
    } else if (pType === 'blog' || page.routeName?.includes('blog')) {
      const g = SEO_TEMPLATES.blog(blueprint, page, route);
      blogGraph.push(...g);
      globalGraph.push(...g);
    }

    breadcrumbGraph.push(SEO_TEMPLATES.breadcrumbs(blueprint, page, route));
  });

  // Export des fichiers JSON-LD
  files["public/schema.global.jsonld"] = JSON.stringify({ "@context": "https://schema.org", "@graph": globalGraph }, null, 2);
  files["public/schema.home.jsonld"] = JSON.stringify({ "@context": "https://schema.org", "@graph": homeEntries }, null, 2);
  files["public/schema.service.jsonld"] = JSON.stringify({ "@context": "https://schema.org", "@graph": serviceGraph }, null, 2);
  files["public/schema.local.jsonld"] = JSON.stringify({ "@context": "https://schema.org", "@graph": [SEO_BUILDERS.organization(blueprint)] }, null, 2);
  files["public/schema.blog-post.jsonld"] = JSON.stringify({ "@context": "https://schema.org", "@graph": blogGraph }, null, 2);
  files["public/schema.breadcrumbs.jsonld"] = JSON.stringify({ "@context": "https://schema.org", "@graph": breadcrumbGraph }, null, 2);

  // 3. Sitemaps segmentés (Toujours générés pour la structure)
  files["public/sitemap-index.xml"] = buildSitemapIndex(blueprint);
  const segments = [
    { name: "sitemap-pages.xml", type: "page" },
    { name: "sitemap-services.xml", type: "service" },
    { name: "sitemap-blog.xml", type: "blog" },
    { name: "sitemap-local.xml", type: "location" },
    { name: "sitemap-realisations.xml", type: "project" }
  ];

  segments.forEach(seg => {
    const routeNames = (blueprint.routes || [])
      .filter(r => r.pageType === seg.type || r.name.includes(seg.type) || (seg.type === 'page' && !r.pageType))
      .map(r => r.name);
    
    // Génération systématique même si vide
    files[`public/sitemaps/${seg.name}`] = buildUrlSet(blueprint, routeNames);
  });

  // 4. Fichiers Techniques standards
  files["public/manifest.json"] = JSON.stringify(blueprint.generatedFiles?.manifestJson || {}, null, 2);
  files["public/robots.txt"] = buildRobotsTxt(blueprint);
  files["public/humans.txt"] = `/* TEAM */\nCompany: ${blueprint.brand?.name}\n\n/* SITE */\nLanguage: ${blueprint.project?.locale}\n`;
  files["public/llms.txt"] = `# ${blueprint.project?.siteName}\nSummary: ${blueprint.brand?.description}\n`;
  files["public/README.md"] = `# ${blueprint.project?.siteName}\nPack technique généré selon les standards Expert Core Standard.\n`;

  return files;
}

/**
 * Fonctions de rendu HTML/Markdown pour le preview (simples)
 */
export function renderPage(blueprint: Blueprint, page: ContentPage): string {
  return `<h1>${page.h1}</h1><p>${page.seoDescription}</p>`;
}
