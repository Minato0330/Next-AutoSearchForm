#!/usr/bin/env tsx
// run the analysis
import { analyzeCompanies } from "../lib/analyzer";
import { saveAllReports, generateSummary } from "../lib/report-generator";
import { loadCompanies } from "../data/sample-companies";
import { AnalyzerConfig } from "../lib/types";

async function main() {
  console.log("🚀 Starting Contact Form Analysis...\n");

  console.log("📋 Loading company list...");
  const companies = await loadCompanies();
  console.log(`✅ Loaded ${companies.length} companies\n`);

  if (companies.length === 0) {
    console.error("❌ No companies to analyze. Please add companies to data/sample-companies.ts");
    process.exit(1);
  }

  const config: AnalyzerConfig = {
    timeout: 30000,
    headless: true, // set to false to see browser
    maxRetries: 2,
    contactPageKeywords: [],
  };

  console.log("🔍 Analyzing companies...\n");
  const startTime = Date.now();

  const results = await analyzeCompanies(companies, config);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n✅ Analysis complete in ${duration}s\n`);

  const summary = generateSummary(results);

  console.log("📊 Summary:");
  console.log(`   Total Companies: ${summary.totalCompanies}`);
  console.log(
    `   Form Discovery Success Rate: ${summary.formDiscoverySuccessRate.toFixed(1)}%`
  );
  console.log(
    `   Dynamic Content Success Rate: ${summary.dynamicContentSuccessRate.toFixed(1)}%`
  );
  console.log("\n   Fillability Breakdown:");
  console.log(`   - Fully Fillable: ${summary.fillabilityBreakdown.full}`);
  console.log(`   - Partially Fillable: ${summary.fillabilityBreakdown.partial}`);
  console.log(`   - Not Fillable: ${summary.fillabilityBreakdown.none}`);
  console.log(`   - No Form Found: ${summary.fillabilityBreakdown.noForm}`);

  console.log("\n💾 Saving reports...");
  const { csv, json } = await saveAllReports(results);

  console.log(`   CSV Report: ${csv}`);
  console.log(`   JSON Report: ${json}`);

  console.log("\n✨ Done!\n");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

