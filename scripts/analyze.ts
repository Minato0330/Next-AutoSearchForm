#!/usr/bin/env tsx
import { analyzeCompanies } from "../lib/analyzer";
import { saveAllReports, generateSummary } from "../lib/report-generator";
import { loadCompanies } from "../data/sample-companies";
import { AnalyzerConfig } from "../lib/types";

async function main() {
  const companies = await loadCompanies();

  if (companies.length === 0) {
    process.exit(1);
  }

  const config: AnalyzerConfig = {
    timeout: 30000,
    headless: true,
    maxRetries: 2,
    contactPageKeywords: [],
  };

  const results = await analyzeCompanies(companies, config);

  const summary = generateSummary(results);

  await saveAllReports(results);
}

main().catch((error) => {
  process.exit(1);
});

