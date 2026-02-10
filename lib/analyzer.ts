import { chromium, Browser } from "playwright";
import {
  CompanyInput,
  AnalysisResult,
  FillabilityStatus,
  AnalyzerConfig,
} from "./types";
import { findContactPage, hasContactForm } from "./contact-page-discovery";
import { waitForDynamicContent, scrollToLoadContent } from "./spa-handler";
import { extractContactForm } from "./form-extractor";
import { assessFillability } from "./fillability-assessor";

const DEFAULT_CONFIG: AnalyzerConfig = {
  timeout: 30000,
  headless: true,
  maxRetries: 2,
  contactPageKeywords: [],
};

export async function analyzeCompany(
  company: CompanyInput,
  browser: Browser,
  config: AnalyzerConfig = DEFAULT_CONFIG
): Promise<AnalysisResult> {
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(config.timeout);

    const contactPageResult = await findContactPage(page, company.url);

    if (!contactPageResult.found || !contactPageResult.url) {
      return {
        companyName: company.name,
        companyUrl: company.url,
        formPageFound: false,
        dynamicContentLoaded: false,
        fillabilityStatus: FillabilityStatus.NO_FORM,
        errorMessage: contactPageResult.error || "Contact page not found",
        timestamp: new Date().toISOString(),
      };
    }

    await page.goto(contactPageResult.url, {
      waitUntil: "domcontentloaded",
      timeout: config.timeout,
    });

    // wait for network idle with fallback
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      // continue even if networkidle times out
    });

    // extra wait for dynamic content
    await page.waitForTimeout(3000);

    const dynamicContentResult = await waitForDynamicContent(
      page,
      config.timeout
    );

    await scrollToLoadContent(page);

    await page.waitForTimeout(2000);

    const hasForm = await hasContactForm(page);

    if (!hasForm) {
      return {
        companyName: company.name,
        companyUrl: company.url,
        formPageFound: true,
        formPageUrl: contactPageResult.url,
        dynamicContentLoaded: dynamicContentResult.loaded,
        fillabilityStatus: FillabilityStatus.NO_FORM,
        errorMessage: "No form found on contact page",
        timestamp: new Date().toISOString(),
      };
    }

    const formStructure = await extractContactForm(page);

    if (!formStructure) {
      return {
        companyName: company.name,
        companyUrl: company.url,
        formPageFound: true,
        formPageUrl: contactPageResult.url,
        dynamicContentLoaded: dynamicContentResult.loaded,
        fillabilityStatus: FillabilityStatus.NO_FORM,
        errorMessage: "Could not extract form structure",
        timestamp: new Date().toISOString(),
      };
    }

    const { status, mappedFields, unmappedRequiredFields } =
      assessFillability(formStructure);

    return {
      companyName: company.name,
      companyUrl: company.url,
      formPageFound: true,
      formPageUrl: contactPageResult.url,
      dynamicContentLoaded: dynamicContentResult.loaded,
      fillabilityStatus: status,
      formStructure,
      mappedFields,
      unmappedRequiredFields,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      companyName: company.name,
      companyUrl: company.url,
      formPageFound: false,
      dynamicContentLoaded: false,
      fillabilityStatus: FillabilityStatus.NO_FORM,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
}

// Progress callback type
export type ProgressCallback = (completed: number, total: number, currentCompany: string) => void;

// analyze multiple companies in parallel with concurrency limit and progress tracking
export async function analyzeCompanies(
  companies: CompanyInput[],
  config: AnalyzerConfig = DEFAULT_CONFIG,
  onProgress?: ProgressCallback
): Promise<AnalysisResult[]> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
      ],
    });

    const results: AnalysisResult[] = [];
    const totalCompanies = companies.length;
    let completedCount = 0;

    const CONCURRENCY_LIMIT = 3;

    for (let i = 0; i < companies.length; i += CONCURRENCY_LIMIT) {
      const batch = companies.slice(i, i + CONCURRENCY_LIMIT);

      const batchPromises = batch.map(async (company) => {
        const result = await analyzeCompany(company, browser!, config);
        completedCount++;

        if (onProgress) {
          onProgress(completedCount, totalCompanies, company.name);
        }

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  } finally {
    if (browser) {
      try {
        const pages = browser.contexts().flatMap(context => context.pages());
        await Promise.all(pages.map(page => page.close().catch(() => {})));
        await browser.close();
      } catch (error) {
        try {
          await browser.close();
        } catch {
        }
      }
    }
  }
}

