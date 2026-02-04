// Contact page finder
// TODO: maybe add more languages later?
import { Page } from "playwright";

export interface ContactPageResult {
  found: boolean;
  url?: string;
  error?: string;
  allContactUrls?: string[]; // all found contact URLs for debugging
}

export interface ContactPageOptions {
  preferredLanguage?: string; // e.g., "en", "ja", "us-en", "jp-ja" - optional, defaults to "auto"
  returnAllMatches?: boolean; // return all found contact URLs
}

// keywords to look for - add more if needed
const CONTACT_KEYWORDS = [
  "contact",
  "contact us",
  "get in touch",
  "inquiry",
  "inquiries",
  "reach us",
  "support",
  "help",
  // japanese keywords
  "お問い合わせ",
  "お問合せ",
  "問い合わせ",
  "問合せ",
  "コンタクト",
  "連絡",
  "ご相談",
];

/**
 * Find contact page URL from the homepage
 */
export async function findContactPage(
  page: Page,
  baseUrl: string,
  options: ContactPageOptions = {}
): Promise<ContactPageResult> {
  const { preferredLanguage = "auto", returnAllMatches = false } = options;
  try {
    // Navigate to homepage
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for network to be idle (important for SPAs)
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      // continue even if networkidle times out
    });

    // Give extra time for dynamic content to render
    await page.waitForTimeout(3000);

    // Try to wait for navigation elements to appear
    await page.waitForSelector("nav, header, a", { timeout: 5000 }).catch(() => {
      // continue if no nav found
    });

    // Find all links on the page - retry up to 3 times
    let links: Array<{ href: string; text: string; ariaLabel: string }> = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => ({
          href: a.href,
          text: a.textContent?.trim() || "",
          ariaLabel: a.getAttribute("aria-label") || "",
        }))
      );

      if (links.length > 0) break;

      // Wait a bit before retrying
      await page.waitForTimeout(2000);
    }

    if (links.length === 0) {
      return {
        found: false,
        error: "No links found on page",
      };
    }

    // Filter links that match contact keywords OR have contact-related URL patterns
    const contactLinks = links.filter((link) => {
      const searchText = `${link.text} ${link.ariaLabel} ${link.href}`.toLowerCase();
      const href = link.href.toLowerCase();

      // Check for contact keywords in text/aria-label/URL
      const hasContactKeyword = CONTACT_KEYWORDS.some((keyword) =>
        searchText.includes(keyword.toLowerCase())
      );

      // ALSO check for common contact URL patterns (even if text doesn't match)
      // This catches links like /jp/contact/, /ja/contact/, etc.
      const hasContactUrlPattern = /\/(contact|inquiry|support|toiawase|otoiawase)(\/|$|-)/i.test(href);

      return hasContactKeyword || hasContactUrlPattern;
    });

    console.log(`[Contact Discovery] Found ${contactLinks.length} contact-related links from ${links.length} total links`);

    // Debug: Show some Japanese contact links if found
    const japaneseContactLinks = contactLinks.filter(link =>
      /\/(ja|jp)([-_/]|$)/i.test(link.href)
    );
    if (japaneseContactLinks.length > 0) {
      console.log(`[Contact Discovery] Found ${japaneseContactLinks.length} Japanese contact links:`);
      japaneseContactLinks.slice(0, 3).forEach(link => {
        console.log(`  - ${link.href} (text: "${link.text}")`);
      });
    }

    if (contactLinks.length === 0) {
      return {
        found: false,
        error: "No contact page link found",
      };
    }

    // Score each link to find the best match
    const scoredLinks = contactLinks.map((link) => {
      let score = 0;
      const text = link.text.toLowerCase();
      const href = link.href.toLowerCase();
      const ariaLabel = link.ariaLabel.toLowerCase();

      // Japanese language patterns - ALL variations
      const japanesePatterns = ["/ja/", "/jp/", "/jp-ja/", "/ja-jp/", "/ja_jp/", "/jp_ja/", "/japanese/"];

      // Check if this URL contains Japanese language code
      const isJapaneseUrl = japanesePatterns.some(pattern => href.includes(pattern));

      // Check if URL has OTHER language codes (non-Japanese)
      // Match patterns like /en/, /en-us/, /us-en/, /de/, /fr/, etc.
      const hasOtherLanguage = /\/(de|fr|es|it|cn|kr|tw|en|us|uk|gb|zh)([-_/]|$)/i.test(href);

      // STRICT JAPANESE-ONLY MODE when preferredLanguage is "ja"
      if (preferredLanguage === "ja" || preferredLanguage === "jp-ja") {
        // If URL has non-Japanese language code, REJECT it completely
        if (hasOtherLanguage) {
          score = -1000; // Massive penalty - effectively exclude this link
          return { ...link, score };
        }

        // If URL has Japanese language code, give HUGE boost
        if (isJapaneseUrl) {
          score += 500; // Very high priority for Japanese URLs
        }
      }

      // Japanese text matches get highest priority
      if (text === "お問い合わせ" || text === "問い合わせ") score += 200;
      if (text === "お問合せ" || text === "問合せ") score += 200;
      if (text === "コンタクト") score += 150;
      if (text === "連絡" || text === "ご相談") score += 150;

      // English text matches (lower priority)
      if (text === "contact" || text === "contact us") score += 100;
      if (text === "inquiry" || text === "inquiries") score += 90;

      // URL patterns that indicate contact pages
      if (href.includes("/contact-us")) score += 80;
      if (href.includes("/contact")) score += 70;
      if (href.includes("/inquiry") || href.includes("/toiawase")) score += 70;
      if (href.includes("/support")) score += 60;

      // Prefer shorter URLs (usually more direct)
      const pathLength = new URL(link.href, baseUrl).pathname.split('/').length;
      score -= pathLength * 2;

      // Aria label matches
      if (ariaLabel.includes("contact")) score += 20;

      return { link, score };
    });

    // Sort by score (highest first)
    scoredLinks.sort((a, b) => b.score - a.score);

    // Log top scored links for debugging
    console.log(`[Contact Discovery] Found ${scoredLinks.length} contact links. Top 10 scored:`);
    scoredLinks.slice(0, 10).forEach((sl, i) => {
      const href = sl.link.href;
      const isJa = ["/ja/", "/jp/", "/jp-ja/", "/ja-jp/", "/ja_jp/", "/jp_ja/", "/japanese/"].some(p => href.toLowerCase().includes(p));
      const hasOther = /\/(de|fr|es|it|cn|kr|tw|en|us|uk|gb|zh)([-_/]|$)/i.test(href.toLowerCase());
      console.log(`  ${i + 1}. [Score: ${sl.score}] ${href}`);
      console.log(`      Text: "${sl.link.text}" | isJapanese: ${isJa} | hasOtherLang: ${hasOther}`);
    });

    // FILTER OUT non-Japanese URLs when preferredLanguage is "ja"
    let filteredLinks = scoredLinks;
    if (preferredLanguage === "ja" || preferredLanguage === "jp-ja") {
      // Only keep links with positive scores (excludes non-Japanese language URLs)
      filteredLinks = scoredLinks.filter(sl => sl.score > 0);

      console.log(`[Contact Discovery] Filtered to ${filteredLinks.length} Japanese contact pages`);

      // If no Japanese URLs found, return error
      if (filteredLinks.length === 0) {
        return {
          found: false,
          error: "No Japanese contact page found. Only non-Japanese language pages are available.",
        };
      }
    }

    // Get all contact URLs for debugging
    const allContactUrls = filteredLinks.map(sl => new URL(sl.link.href, baseUrl).href);

    // Get the best match
    const bestMatch = filteredLinks[0]?.link;

    if (!bestMatch) {
      return {
        found: false,
        error: "No contact page found",
      };
    }

    // Normalize URL
    const contactUrl = new URL(bestMatch.href, baseUrl).href;

    return {
      found: true,
      url: contactUrl,
      allContactUrls: returnAllMatches ? allContactUrls : undefined,
    };
  } catch (error) {
    return {
      found: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// check if page has a form
export async function hasContactForm(page: Page): Promise<boolean> {
  try {
    const forms = await page.$$("form");
    return forms.length > 0;
  } catch {
    return false;
  }
}

export function getContactKeywords(): string[] {
  return [...CONTACT_KEYWORDS];
}

export function addContactKeywords(keywords: string[]): void {
  CONTACT_KEYWORDS.push(...keywords);
}

