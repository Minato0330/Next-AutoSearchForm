"use client";

import { useState } from "react";
import Link from "next/link";
import { FormStructure } from "@/lib/types";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [contactPageUrl, setContactPageUrl] = useState("");
  const [loadingContact, setLoadingContact] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [contactResult, setContactResult] = useState<{
    found: boolean;
    url?: string;
    error?: string;
    allContactUrls?: string[];
  } | null>(null);
  const [formResult, setFormResult] = useState<{
    formStructure?: FormStructure;
    error?: string;
  } | null>(null);

  const handleFindContact = async () => {
    if (!companyUrl.trim()) {
      alert("Please enter company URL");
      return;
    }

    setLoadingContact(true);
    setContactResult(null);
    setFormResult(null);
    setContactPageUrl("");

    try {
      const response = await fetch("/api/find-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: companyUrl,
          preferredLanguage: "ja", // Always prefer Japanese contact pages
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to find contact page");
      }

      const data = await response.json();
      setContactResult(data);
      if (data.found && data.url) {
        setContactPageUrl(data.url);
      }
    } catch (error) {
      setContactResult({
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingContact(false);
    }
  };

  const handleExtractForm = async () => {
    if (!contactPageUrl) {
      alert("Please find contact page first");
      return;
    }

    setLoadingForm(true);
    setFormResult(null);

    try {
      const response = await fetch("/api/extract-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: contactPageUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract form");
      }

      const data = await response.json();
      setFormResult(data);
    } catch (error) {
      setFormResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Contact Form Analyzer</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Automatically discover and analyze contact forms on company websites
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Step 1: Find Contact Page</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                placeholder="Example Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Company URL
              </label>
              <input
                type="url"
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                placeholder="https://example.com"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
              />
            </div>
            <button
              onClick={handleFindContact}
              disabled={loadingContact}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingContact ? "Searching..." : "Find Contact Page"}
            </button>
          </div>

          {contactResult && (
            <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              {contactResult.found && contactResult.url ? (
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400 mb-2">
                    Contact page found!
                  </p>
                  {companyName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Company: {companyName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Selected Contact Page URL:
                  </p>
                  <a
                    href={contactResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all block mb-4"
                  >
                    {contactResult.url}
                  </a>

                  {contactResult.allContactUrls && contactResult.allContactUrls.length > 1 && (
                    <details className="mt-4">
                      <summary className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
                        Other contact pages found ({contactResult.allContactUrls.length - 1})
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4">
                        {contactResult.allContactUrls
                          .filter(url => url !== contactResult.url)
                          .map((url, index) => (
                            <li key={index}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 dark:text-blue-400 hover:underline break-all"
                              >
                                {url}
                              </a>
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    Contact page not found
                  </p>
                  {contactResult.error && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contactResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {contactPageUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Step 2: Extract Form Fields</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Contact page: <span className="font-mono text-xs">{contactPageUrl}</span>
            </p>
            <button
              onClick={handleExtractForm}
              disabled={loadingForm}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingForm ? "Extracting..." : "Extract Form Fields"}
            </button>

            {formResult && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                {formResult.formStructure && formResult.formStructure.fields.length > 0 ? (
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400 mb-3">
                      Form Fields ({formResult.formStructure.fields.length} fields):
                    </p>
                    <div className="space-y-2">
                      {formResult.formStructure.fields.map((field, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {field.label || field.name || "Unnamed field"}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Type: {field.type}
                                {field.name && ` | Name: ${field.name}`}
                              </p>
                              {field.placeholder && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Placeholder: {field.placeholder}
                                </p>
                              )}
                              {field.options && field.options.length > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Options: {field.options.slice(0, 3).join(", ")}
                                  {field.options.length > 3 && "..."}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formResult.formStructure.submitButton && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        Submit button: {formResult.formStructure.submitButton}
                      </p>
                    )}
                  </div>
                ) : formResult.formStructure && formResult.formStructure.fields.length === 0 ? (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    No form fields found on this page
                  </p>
                ) : formResult.error ? (
                  <div>
                    <p className="font-semibold text-red-600 dark:text-red-400 mb-2">
                      Failed to extract form
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formResult.error}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Batch Analysis</h2>
            <p className="mb-4">
              Analyze multiple companies at once with detailed reports.
            </p>
            <Link
              href="/analyze"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Batch Analysis
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Command Line</h2>
            <p className="mb-4">
              Run batch analysis from the command line for larger datasets.
            </p>
            <code className="block bg-gray-100 dark:bg-gray-900 px-4 py-3 rounded text-sm">
              npm run analyze
            </code>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2">
            <li>Automatic contact page discovery</li>
            <li>SPA and dynamic content handling</li>
            <li>Form structure extraction</li>
            <li>Auto-fill capability assessment</li>
            <li>CSV and JSON report generation</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

