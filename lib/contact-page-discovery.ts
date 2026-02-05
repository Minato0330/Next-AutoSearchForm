import { Page } from "playwright";

export interface ContactPageResult {
  found: boolean;
  url?: string;
  error?: string;
  allContactUrls?: string[];
}

export interface ContactPageOptions {
  preferredLanguage?: string;
  returnAllMatches?: boolean;
}

const CONTACT_KEYWORDS = [
  "contact",
  "contact us",
  "get in touch",
  "inquiry",
  "inquiries",
  "reach us",
  "support",
  "help",
  "お問い合わせ",
  "お問合せ",
  "問い合わせ",
  "問合せ",
  "コンタクト",
  "連絡",
  "ご相談",
];

export async function findContactPage(
  page: Page,
  baseUrl: string,
  options: ContactPageOptions = {}
): Promise<ContactPageResult> {
  const { preferredLanguage = "auto", returnAllMatches = false } = options;
  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    await page.waitForTimeout(3000);

    await page.waitForSelector("nav, header, a", { timeout: 5000 }).catch(() => {});

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

      await page.waitForTimeout(2000);
    }

    if (links.length === 0) {
      return {
        found: false,
        error: "No links found on page",
      };
    }

    const contactLinks = links.filter((link) => {
      const searchText = `${link.text} ${link.ariaLabel} ${link.href}`.toLowerCase();
      const href = link.href.toLowerCase();

      const hasContactKeyword = CONTACT_KEYWORDS.some((keyword) =>
        searchText.includes(keyword.toLowerCase())
      );

      const hasContactUrlPattern = /\/(contact|inquiry|support|toiawase|otoiawase)(\/|$|-)/i.test(href);

      return hasContactKeyword || hasContactUrlPattern;
    });

    if (contactLinks.length === 0) {
      return {
        found: false,
        error: "No contact page link found",
      };
    }

    const scoredLinks = contactLinks.map((link) => {
      let score = 0;
      const text = link.text.toLowerCase();
      const href = link.href.toLowerCase();
      const ariaLabel = link.ariaLabel.toLowerCase();

      const japanesePatterns = ["/ja/", "/jp/", "/jp-ja/", "/ja-jp/", "/ja_jp/", "/jp_ja/", "/japanese/"];

      const isJapaneseUrl = japanesePatterns.some(pattern => href.includes(pattern));

      const hasOtherLanguage = /\/(de|fr|es|it|cn|kr|tw|en|us|uk|gb|zh)([-_/]|$)/i.test(href);

      if (preferredLanguage === "ja" || preferredLanguage === "jp-ja") {
        if (hasOtherLanguage) {
          score = -1000;
          return { link, score };
        }

        if (isJapaneseUrl) {
          score += 500;
        }
      }

      if (text === "お問い合わせ" || text === "問い合わせ") score += 200;
      if (text === "お問合せ" || text === "問合せ") score += 200;
      if (text === "コンタクト") score += 150;
      if (text === "連絡" || text === "ご相談") score += 150;

      if (text === "contact" || text === "contact us") score += 100;
      if (text === "inquiry" || text === "inquiries") score += 90;

      if (href.includes("/contact-us")) score += 80;
      if (href.includes("/contact")) score += 70;
      if (href.includes("/inquiry") || href.includes("/toiawase")) score += 70;
      if (href.includes("/support")) score += 60;

      const pathLength = new URL(link.href, baseUrl).pathname.split('/').length;
      score -= pathLength * 2;

      if (ariaLabel.includes("contact")) score += 20;

      return { link, score };
    });

    scoredLinks.sort((a, b) => b.score - a.score);

    let filteredLinks = scoredLinks;
    if (preferredLanguage === "ja" || preferredLanguage === "jp-ja") {
      filteredLinks = scoredLinks.filter(sl => sl.score > 0);

      if (filteredLinks.length === 0) {
        return {
          found: false,
          error: "No Japanese contact page found. Only non-Japanese language pages are available.",
        };
      }
    }

    const allContactUrls = filteredLinks.map(sl => new URL(sl.link.href, baseUrl).href);

    const bestMatch = filteredLinks[0]?.link;

    if (!bestMatch) {
      return {
        found: false,
        error: "No contact page found",
      };
    }

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

