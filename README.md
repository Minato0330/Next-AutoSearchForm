# Contact Form Analyzer

A Next.js demo project that automatically discovers and analyzes contact forms on public company websites using Playwright.

## 🎯 Project Overview

This tool evaluates whether contact forms can be auto-filled with standard contact information, without actually submitting them. It's designed to analyze ~300 websites and measure success/failure rates.

### Key Features

- ✅ **Contact Page Discovery**: Automatically finds contact/inquiry pages from company homepages
- ✅ **SPA Support**: Handles JavaScript-rendered content and modern frameworks (React, Vue, Angular, Next.js)
- ✅ **Form Extraction**: Analyzes form structures including fields, types, labels, and requirements
- ✅ **Fillability Assessment**: Classifies forms as Fully/Partially/Not Fillable
- ✅ **Report Generation**: Exports results to CSV and JSON formats

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers:

```bash
npx playwright install chromium
```

### Usage

#### Option 1: Web Interface

1. Start the development server:

```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. Navigate to the "Start Analysis" page
4. Enter companies in the format: `Company Name, URL` (one per line)
5. Click "Start Analysis"

#### Option 2: Command Line

1. Edit `data/sample-companies.ts` to add your company list
2. Run the analysis:

```bash
npm run analyze
```

3. Results will be saved to the `results/` directory

## 📊 Output

The analyzer generates reports with the following information:

- Company URL
- Form Page Found (Yes/No)
- Form Page URL
- Dynamic Content Loaded (Yes/No)
- Fillability Status (Full/Partial/None/No Form Found)
- Field Details (extracted form structure)
- Error Message (if any)

### Metrics Tracked

1. **Form Discovery Success Rate**: % of websites where a contact form page is found
2. **Dynamic Content Load Success Rate**: % of pages where SPA/JS content loads correctly
3. **Auto-fill Capability Breakdown**:
   - Fully fillable
   - Partially fillable
   - Not fillable
   - No form found

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/analyze/       # API route for analysis
│   ├── analyze/           # Analysis UI page
│   └── page.tsx           # Homepage
├── lib/                   # Core library modules
│   ├── analyzer.ts        # Main orchestration
│   ├── contact-page-discovery.ts
│   ├── spa-handler.ts
│   ├── form-extractor.ts
│   ├── fillability-assessor.ts
│   ├── report-generator.ts
│   └── types.ts           # TypeScript definitions
├── data/                  # Company data
│   └── sample-companies.ts
├── scripts/               # CLI scripts
│   └── analyze.ts
└── results/               # Generated reports (gitignored)
```

## 🔧 Configuration

Edit the analyzer configuration in `scripts/analyze.ts` or when calling the API:

```typescript
const config = {
  timeout: 30000,        // Request timeout in ms
  headless: true,        // Run browser in headless mode
  maxRetries: 2,         // Max retry attempts
  contactPageKeywords: [] // Additional keywords for contact page detection
};
```

## 📝 Supported Languages

The analyzer supports both English and Japanese contact pages:

- English: "Contact", "Contact Us", "Inquiry", etc.
- Japanese: "お問い合わせ", "問い合わせ", "コンタクト", etc.

## ⚠️ Limitations (Current Phase)

- ❌ No actual form submission
- ❌ No CAPTCHA bypass (manual only)
- ✅ Analysis only

## 🔮 Future Enhancements (Out of Scope)

- Automated form filling
- Submission logic
- CAPTCHA handling
- LinkedIn integration
- CSV import
- API integration

## 📄 License

MIT

## 🤝 Contributing

This is a demo project. Feel free to fork and extend it for your needs.

