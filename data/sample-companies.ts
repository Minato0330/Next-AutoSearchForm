/**
 * Sample company data for testing
 * Replace with your actual company list
 */

import { CompanyInput } from "../lib/types";

export const sampleCompanies: CompanyInput[] = [
  {
    name: "Mozilla",
    url: "https://www.mozilla.org",
  },
  {
    name: "WordPress",
    url: "https://wordpress.org",
  },
  {
    name: "GitHub",
    url: "https://github.com",
  },
  // Add more companies here
  // You can extend this list to ~300 companies for full analysis
  // Format: { name: "Company Name", url: "https://company-url.com" }
];

/**
 * Load companies from various sources
 * This can be extended to load from CSV, API, LinkedIn, etc.
 */
export async function loadCompanies(): Promise<CompanyInput[]> {
  // For now, return sample companies
  // TODO: Implement CSV loading, API integration, etc.
  return sampleCompanies;
}

