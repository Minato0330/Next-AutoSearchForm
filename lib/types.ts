/**
 * Core type definitions for the contact form analyzer
 */

// Input: Company information
export interface CompanyInput {
  name: string;
  url: string;
}

// Form field information
export interface FormField {
  name: string;
  type: string; // text, email, tel, textarea, select, checkbox, radio, etc.
  label?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
}

// Form structure
export interface FormStructure {
  action?: string;
  method?: string;
  fields: FormField[];
  submitButton?: string;
}

// Fillability classification
export enum FillabilityStatus {
  FULL = "Full",
  PARTIAL = "Partial",
  NONE = "None",
  NO_FORM = "No Form Found",
}

// Standard contact data mapping
export interface ContactDataMapping {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  subject?: string;
  [key: string]: string | undefined;
}

// Analysis result for a single company
export interface AnalysisResult {
  companyName: string;
  companyUrl: string;
  formPageFound: boolean;
  formPageUrl?: string;
  dynamicContentLoaded: boolean;
  fillabilityStatus: FillabilityStatus;
  formStructure?: FormStructure;
  mappedFields?: ContactDataMapping;
  unmappedRequiredFields?: string[];
  errorMessage?: string;
  timestamp: string;
}

// Report summary
export interface ReportSummary {
  totalCompanies: number;
  formDiscoverySuccessRate: number;
  dynamicContentSuccessRate: number;
  fillabilityBreakdown: {
    full: number;
    partial: number;
    none: number;
    noForm: number;
  };
  results: AnalysisResult[];
  generatedAt: string;
}

// Configuration for the analyzer
export interface AnalyzerConfig {
  timeout: number; // milliseconds
  headless: boolean;
  userAgent?: string;
  maxRetries: number;
  contactPageKeywords: string[];
}

