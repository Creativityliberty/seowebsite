import { z } from 'zod';

export const VariablesSchema = z.record(z.string(), z.any());

export const RouteSchema = z.object({
  name: z.string().optional(),
  path: z.string().optional(),
  pageType: z.string().optional(),
  template: z.string().optional(),
  schemaTemplate: z.enum(['home', 'service', 'local', 'blog', 'realisation']).optional(),
  layout: z.string().optional(),
  index: z.boolean().optional(),
  priority: z.number().optional(),
  changefreq: z.string().optional(),
  schemaTypes: z.array(z.string()).optional(),
}).passthrough();

export const ProjectSchema = z.object({
  baseUrl: z.string().optional(),
  siteName: z.string().optional(),
  locale: z.string().optional(),
  version: z.string().optional(),
  trailingSlash: z.boolean().optional(),
  language: z.string().optional(),
  address: z.any().optional(), // Global project address fallback
  geo: z.any().optional(),
  areaServed: z.any().optional(),
}).passthrough();

export const BrandSchema = z.object({
  name: z.string().optional(),
  alternateName: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  images: z.object({
    hero: z.string().optional(),
    gallery: z.array(z.string()).optional(),
  }).passthrough().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  priceRange: z.string().optional(),
  slogan: z.string().optional(),
  foundingDate: z.string().optional(),
  vatID: z.string().optional(),
  taxID: z.string().optional(),
  address: z.any().optional(),
  geo: z.any().optional(),
  sameAs: z.array(z.string()).optional(),
  openingHours: z.array(z.any()).optional(),
  reviews: z.array(z.any()).optional(),
  aggregateRating: z.any().optional(),
  knowsAbout: z.array(z.string()).optional(),
  hasOfferCatalog: z.any().optional(),
}).passthrough();

export const SectionSchema = z.object({
  h2: z.string().optional(),
  h3: z.array(z.string()).optional(),
}).passthrough();

export const ContentPageSchema = z.object({
  routeName: z.string().optional(),
  url: z.string().optional(),
  pageType: z.string().optional(), // 'home', 'service', 'blog', 'location', etc.
  h1: z.string().optional(),
  introGoal: z.string().optional(),
  sections: z.array(SectionSchema).optional(),
  outline: z.array(SectionSchema).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  author: z.any().optional(),
}).passthrough();

export const BlueprintSchema = z.object({
  project: ProjectSchema.optional(),
  brand: BrandSchema.optional(),
  routes: z.array(RouteSchema).optional(),
  generatedFiles: z.object({
    robotsTxt: z.any().optional(),
    humansTxt: z.any().optional(),
    llmsTxt: z.any().optional(),
    manifestJson: z.any().optional(),
  }).passthrough().optional(),
  sitemaps: z.object({
    index: z.object({ children: z.array(z.string()) }).optional(),
    segments: z.array(z.object({
      fileName: z.string(),
      routeNames: z.array(z.string()).optional(),
    }).passthrough()).optional(),
  }).passthrough().optional(),
  contentPages: z.array(ContentPageSchema).optional(),
}).passthrough();

export const AiGenerationResponseSchema = z.union([
  z.object({ question: z.string() }),
  z.object({
    blueprint: BlueprintSchema,
    variables: VariablesSchema.optional().default({}),
  })
]);

export type Variables = z.infer<typeof VariablesSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
export type ContentPage = z.infer<typeof ContentPageSchema>;
export type AiGenerationResponse = z.infer<typeof AiGenerationResponseSchema>;
