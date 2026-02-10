import playwright from "playwright-aws-lambda";

// In your function where you launch the browser:
const browser = await playwright.launchChromium();
const page = await browser.newPage();

import { Page } from "playwright";

export interface DynamicContentResult {
  loaded: boolean;
  error?: string;
}

export async function waitForDynamicContent(
  page: Page,
  timeout: number = 30000
): Promise<DynamicContentResult> {
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    await page.waitForTimeout(3000);

    let hasContent = false;
    for (let i = 0; i < 3; i++) {
      hasContent = await page.evaluate(() => {
        const body = document.body;
        return !!(body && body.textContent && body.textContent.trim().length > 100);
      });

      if (hasContent) break;

      await page.waitForTimeout(2000);
    }

    if (!hasContent) {
      return {
        loaded: false,
        error: "Page loaded but no content found",
      };
    }

    return {
      loaded: true,
    };
  } catch (error) {
    return {
      loaded: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function waitForSelectors(
  page: Page,
  selectors: string[],
  timeout: number = 10000
): Promise<boolean> {
  try {
    await Promise.race(
      selectors.map((selector) =>
        page.waitForSelector(selector, { timeout, state: "visible" })
      )
    );
    return true;
  } catch {
    return false;
  }
}

export async function detectSPAFramework(page: Page): Promise<string | null> {
  try {
    const framework = await page.evaluate(() => {
      if (
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
        document.querySelector("[data-reactroot]") ||
        document.querySelector("[data-reactid]")
      ) {
        return "React";
      }

      if ((window as any).__VUE__ || document.querySelector("[data-v-]")) {
        return "Vue";
      }

      if (
        (window as any).ng ||
        (window as any).getAllAngularRootElements ||
        document.querySelector("[ng-version]")
      ) {
        return "Angular";
      }

      if ((window as any).__NEXT_DATA__) {
        return "Next.js";
      }

      if ((window as any).__NUXT__) {
        return "Nuxt";
      }

      return null;
    });

    return framework;
  } catch {
    return null;
  }
}

export async function scrollToLoadContent(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollSteps = Math.min(Math.ceil(scrollHeight / viewportHeight), 5); // limit to 5 steps

      for (let i = 0; i <= scrollSteps; i++) {
        window.scrollTo(0, viewportHeight * i);
        // wait longer for content to load
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // scroll to bottom to ensure everything loads
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // back to top
      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
  } catch (error) {
    // ignore errors
  }
}

export async function waitForForms(
  page: Page,
  timeout: number = 10000
): Promise<boolean> {
  try {
    await page.waitForSelector("form", { timeout, state: "attached" });
    return true;
  } catch {
    return false;
  }
}



