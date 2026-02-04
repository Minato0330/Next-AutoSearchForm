// generate reports from analysis results
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { AnalysisResult, ReportSummary, FillabilityStatus } from "./types";

export function generateSummary(
  results: AnalysisResult[]
): ReportSummary {
  const totalCompanies = results.length;
  const formPageFound = results.filter((r) => r.formPageFound).length;
  const dynamicContentLoaded = results.filter(
    (r) => r.dynamicContentLoaded
  ).length;

  const fillabilityBreakdown = {
    full: results.filter((r) => r.fillabilityStatus === FillabilityStatus.FULL)
      .length,
    partial: results.filter(
      (r) => r.fillabilityStatus === FillabilityStatus.PARTIAL
    ).length,
    none: results.filter((r) => r.fillabilityStatus === FillabilityStatus.NONE)
      .length,
    noForm: results.filter(
      (r) => r.fillabilityStatus === FillabilityStatus.NO_FORM
    ).length,
  };

  return {
    totalCompanies,
    formDiscoverySuccessRate:
      totalCompanies > 0 ? (formPageFound / totalCompanies) * 100 : 0,
    dynamicContentSuccessRate:
      totalCompanies > 0 ? (dynamicContentLoaded / totalCompanies) * 100 : 0,
    fillabilityBreakdown,
    results,
    generatedAt: new Date().toISOString(),
  };
}

// convert to CSV
export function generateCSV(results: AnalysisResult[]): string {
  const headers = [
    "Company Name",
    "Company URL",
    "Form Page Found",
    "Form Page URL",
    "Dynamic Content Loaded",
    "Fillability Status",
    "Mapped Fields",
    "Unmapped Required Fields",
    "Total Fields",
    "Error Message",
    "Timestamp",
  ];

  const rows = results.map((result) => {
    let mappedFields = "";
    if (result.mappedFields) {
      mappedFields = Object.entries(result.mappedFields)
        .map(([key, value]) => `${key}:${value}`)
        .join("; ");
    }

    const unmappedFields = result.unmappedRequiredFields
      ? result.unmappedRequiredFields.join("; ")
      : "";

    const totalFields = result.formStructure?.fields.length || 0;

    return [
      escapeCSV(result.companyName),
      escapeCSV(result.companyUrl),
      result.formPageFound ? "Yes" : "No",
      escapeCSV(result.formPageUrl || ""),
      result.dynamicContentLoaded ? "Yes" : "No",
      result.fillabilityStatus,
      escapeCSV(mappedFields),
      escapeCSV(unmappedFields),
      totalFields.toString(),
      escapeCSV(result.errorMessage || ""),
      result.timestamp,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  return csvContent;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function saveReport(
  results: AnalysisResult[],
  format: "csv" | "json" = "csv",
  outputDir: string = "./results"
): Promise<string> {
  await mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `contact-form-analysis-${timestamp}.${format}`;
  const filepath = join(outputDir, filename);

  if (format === "csv") {
    const csvContent = generateCSV(results);
    await writeFile(filepath, csvContent, "utf-8");
  } else {
    const summary = generateSummary(results);
    await writeFile(filepath, JSON.stringify(summary, null, 2), "utf-8");
  }

  return filepath;
}

export async function saveAllReports(
  results: AnalysisResult[],
  outputDir: string = "./results"
): Promise<{ csv: string; json: string }> {
  const [csv, json] = await Promise.all([
    saveReport(results, "csv", outputDir),
    saveReport(results, "json", outputDir),
  ]);

  return { csv, json };
}

