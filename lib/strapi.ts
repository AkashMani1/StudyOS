/**
 * Strapi CMS Client
 * 
 * Provides methods to fetch content from the Strapi CMS.
 * Includes a robust fallback mechanism to ensure the site
 * functions even if the CMS is unreachable.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export interface StrapiHero {
  title: string;
  subtitle: string;
  badge: string;
}

export interface StrapiFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
}

export interface StrapiStep {
  step: string;
  title: string;
  description: string;
  accent: string;
  line: string;
}

async function fetchStrapi<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
        ...options.headers,
      },
      next: { revalidate: 3600, ...(options as any).next }, // Cache for 1 hour by default
    });

    if (!res.ok) {
      console.warn(`Strapi fetch failed: ${path} (${res.status})`);
      return null;
    }

    const json = await res.json();
    return json.data as T;
  } catch (error) {
    console.warn(`Strapi connection error: ${path}`, error);
    return null;
  }
}

export const strapi = {
  getHero: () => fetchStrapi<StrapiHero>("hero"),
  getFeatures: () => fetchStrapi<StrapiFeature[]>("features"),
  getSteps: () => fetchStrapi<StrapiStep[]>("steps"),
  getQuote: () => fetchStrapi<{ text: string }>("quote"),
  getExploreProfile: () => fetchStrapi<any>("explore-profile"),
  getExploreTasks: () => fetchStrapi<any[]>("explore-tasks"),
  getExploreSessions: () => fetchStrapi<any[]>("explore-sessions"),
};
