# Usage Guide

## Quick Start

### 1. Web Interface (Recommended for Small Batches)

```bash
# Start the development server
npm run dev
```

Then open http://localhost:3000 and:
1. Click "Start Analysis"
2. Enter companies in format: `Company Name, URL` (one per line)
3. Click "Start Analysis" button
4. View results in real-time

**Example Input:**
```
Mozilla, https://www.mozilla.org
WordPress, https://wordpress.org
GitHub, https://github.com
```

### 2. Command Line (Recommended for Large Batches)

```bash
# Edit the company list
# Open data/sample-companies.ts and add your companies

# Run the analysis
npm run analyze

# Results will be saved to:
# - results/contact-form-analysis-[timestamp].csv
# - results/contact-form-analysis-[timestamp].json
```

## Adding Companies

### Method 1: Edit sample-companies.ts

```typescript
export const sampleCompanies: CompanyInput[] = [
  {
    name: "Company Name",
    url: "https://company-website.com",
  },
  // Add more...
];
```

### Method 2: Create a CSV Loader (Future Enhancement)

You can extend `data/sample-companies.ts` to load from CSV:

```typescript
import { readFile } from 'fs/promises';

export async function loadCompaniesFromCSV(filepath: string): Promise<CompanyInput[]> {
  const content = await readFile(filepath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  return lines.map(line => {
    const [name, url] = line.split(',');
    return { name: name.trim(), url: url.trim() };
  });
}
```

## Configuration Options

### Analyzer Configuration

```typescript
const config: AnalyzerConfig = {
  timeout: 30000,        // Request timeout (ms)
  headless: true,        // Run browser in headless mode
  maxRetries: 2,         // Max retry attempts
  contactPageKeywords: [] // Additional keywords
};
```

### Headless vs Headed Mode

**Headless (default)**: Faster, runs in background
```typescript
headless: true
```

**Headed**: See browser in action (useful for debugging)
```typescript
headless: false
```

## Understanding Results

### Fillability Status

- **Full**: All required fields can be auto-filled
- **Partial**: Some required fields can be auto-filled
- **None**: No required fields can be auto-filled
- **No Form Found**: No contact form detected

### CSV Report Columns

1. **Company Name**: Name of the company
2. **Company URL**: Homepage URL
3. **Form Page Found**: Yes/No
4. **Form Page URL**: URL of the contact page
5. **Dynamic Content Loaded**: Yes/No (SPA detection)
6. **Fillability Status**: Full/Partial/None/No Form Found
7. **Mapped Fields**: Fields that can be auto-filled
8. **Unmapped Required Fields**: Required fields that cannot be mapped
9. **Total Fields**: Total number of form fields
10. **Error Message**: Any errors encountered
11. **Timestamp**: When the analysis was performed

### JSON Report Structure

```json
{
  "totalCompanies": 100,
  "formDiscoverySuccessRate": 85.5,
  "dynamicContentSuccessRate": 92.3,
  "fillabilityBreakdown": {
    "full": 45,
    "partial": 30,
    "none": 10,
    "noForm": 15
  },
  "results": [...]
}
```

## Tips for Best Results

1. **Use HTTPS URLs**: Always use `https://` in URLs
2. **Include www if needed**: Some sites redirect, use the canonical URL
3. **Test with small batches first**: Start with 5-10 companies
4. **Adjust timeout for slow sites**: Increase timeout in config
5. **Check results directory**: Reports are saved with timestamps

## Troubleshooting

### "No contact page link found"
- The site might use different keywords
- Add custom keywords to `contactPageKeywords` in config
- Check if the site has a contact page at all

### "Timeout" errors
- Increase the `timeout` value in config
- Check your internet connection
- Some sites might be blocking automated access

### "No form found on contact page"
- The contact page might use email links instead of forms
- The form might be loaded via iframe (not currently supported)
- The form might require authentication

## Performance

- **Average time per site**: 10-30 seconds
- **100 companies**: ~20-50 minutes
- **300 companies**: ~1-2.5 hours

Use headless mode for better performance.

## Next Steps

After analysis:
1. Review the CSV report in Excel/Google Sheets
2. Filter by fillability status
3. Identify patterns in unmapped fields
4. Extend the field mapping logic if needed

