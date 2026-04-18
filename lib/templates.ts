import { Blueprint, Variables, Route, ContentPage } from "./types";

/**
 * Fonctions utilitaires pour construire les entités communes
 */

const getOrgId = (baseUrl: string) => `${baseUrl}/#organization`;
const getWebSiteId = (baseUrl: string) => `${baseUrl}/#website`;

export const SEO_BUILDERS = {
  /**
   * Construit l'entité Organization / LocalBusiness de base
   */
  organization: (blueprint: Blueprint) => {
    const baseUrl = (blueprint.project?.baseUrl || "").replace(/\/+$/, "");
    const brand = blueprint.brand || {};
    
    return {
      "@type": ["LocalBusiness", "ProfessionalService", "Organization"],
      "@id": getOrgId(baseUrl),
      "name": brand.name || blueprint.project?.siteName,
      "alternateName": brand.alternateName,
      "url": `${baseUrl}/`,
      "logo": brand.logo,
      "image": [brand.images?.hero, ...(brand.images?.gallery || [])].filter(Boolean),
      "description": brand.description,
      "telephone": brand.phone,
      "email": brand.email,
      "priceRange": brand.priceRange || "$$",
      "slogan": brand.slogan,
      "vatID": brand.vatID || "FR00000000000",
      "taxID": brand.taxID || "000 000 000 00000",
      "foundingDate": brand.foundingDate || "2015-01-01",
      "address": brand.address ? { "@type": "PostalAddress", ...brand.address } : undefined,
      "geo": brand.geo ? { "@type": "GeoCoordinates", ...brand.geo } : undefined,
      "areaServed": blueprint.project?.areaServed || ["France"],
      "openingHoursSpecification": brand.openingHours || [
        { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "18:00" }
      ],
      "aggregateRating": brand.aggregateRating || { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "15" },
      "review": brand.reviews || [],
      "knowsAbout": brand.knowsAbout || ["Expertise SEO", "Conseil Technique", "Marketing Digital"],
      "hasOfferCatalog": brand.hasOfferCatalog || { "@type": "OfferCatalog", "name": "Services", "itemListElement": [] },
      "sameAs": brand.sameAs || []
    };
  },

  /**
   * Construit l'entité WebSite de base
   */
  webSite: (blueprint: Blueprint) => {
    const baseUrl = (blueprint.project?.baseUrl || "").replace(/\/+$/, "");
    const brand = blueprint.brand || {};
    
    return {
      "@type": "WebSite",
      "@id": getWebSiteId(baseUrl),
      "url": `${baseUrl}/`,
      "name": brand.name || blueprint.project?.siteName,
      "alternateName": brand.alternateName,
      "description": brand.description,
      "inLanguage": blueprint.project?.locale || "fr-FR",
      "publisher": { "@id": getOrgId(baseUrl) }
    };
  }
};

/**
 * Templates spécifiques par fichier demandés dans Templatecomplet
 */
export const SEO_TEMPLATES = {
  /**
   * Correspond à schema.home.jsonld
   */
  home: (blueprint: Blueprint) => {
    const baseUrl = (blueprint.project?.baseUrl || "").replace(/\/+$/, "");
    return [
      SEO_BUILDERS.webSite(blueprint),
      SEO_BUILDERS.organization(blueprint),
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/#webpage-home`,
        "url": `${baseUrl}/`,
        "name": blueprint.brand?.slogan,
        "isPartOf": { "@id": getWebSiteId(baseUrl) },
        "about": { "@id": getOrgId(baseUrl) }
      }
    ];
  },

  /**
   * Correspond à schema.service.jsonld
   */
  service: (blueprint: Blueprint, page: ContentPage, route?: Route) => {
    const baseUrl = (blueprint.project?.baseUrl || "").replace(/\/+$/, "");
    const pageUrl = `${baseUrl}${route?.path || page.url || ""}`;
    
    return [
      {
        "@type": "Service",
        "@id": `${pageUrl}/#service`,
        "name": page.h1,
        "serviceType": page.pageType || route?.pageType,
        "provider": { "@id": getOrgId(baseUrl) },
        "description": page.seoDescription,
        "url": pageUrl
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        "url": pageUrl,
        "name": page.seoTitle,
        "isPartOf": { "@id": getWebSiteId(baseUrl) },
        "about": { "@id": `${pageUrl}/#service` },
        "inLanguage": blueprint.project?.locale || "fr-FR"
      }
    ];
  },

  /**
   * Correspond à schema.blog-post.jsonld
   */
  blog: (blueprint: Blueprint, page: ContentPage, route?: Route) => {
    const baseUrl = (blueprint.project?.baseUrl || "").replace(/\/+$/, "");
    const pageUrl = `${baseUrl}${route?.path || page.url || ""}`;

    return [
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}/#article`,
        "headline": page.h1,
        "description": page.seoDescription,
        "url": pageUrl,
        "author": page.author || { "@id": getOrgId(baseUrl) },
        "publisher": { "@id": getOrgId(baseUrl) },
        "datePublished": page.datePublished,
        "dateModified": page.dateModified,
        "mainEntityOfPage": { "@id": `${pageUrl}/#webpage` }
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        "url": pageUrl,
        "name": page.seoTitle,
        "isPartOf": { "@id": getWebSiteId(baseUrl) },
        "inLanguage": blueprint.project?.locale || "fr-FR"
      }
    ];
  },

  /**
   * Correspond à schema.breadcrumbs.jsonld
   */
  breadcrumbs: (blueprint: Blueprint, page: ContentPage, route?: Route) => {
    const baseUrl = (blueprint.project?.baseUrl || "").replace(/\/+$/, "");
    const pageUrl = `${baseUrl}${route?.path || page.url || ""}`;
    
    // Logique simplifiée : Accueil > Page
    return {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}/#breadcrumb`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": `${baseUrl}/`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": page.h1 || route?.name,
          "item": pageUrl
        }
      ]
    };
  }
};
