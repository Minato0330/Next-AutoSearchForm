import { Page } from "playwright";
import { FormStructure, FormField } from "./types";

export async function extractForms(page: Page): Promise<FormStructure[]> {
  try {
    const forms = await page.$$eval("form", (formElements) => {
      return formElements.map((form) => {
        const action = form.getAttribute("action") || undefined;
        const method = form.getAttribute("method") || undefined;

        const inputs = Array.from(
          form.querySelectorAll(
            "input, textarea, select"
          ) as NodeListOf<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >
        );

        const fields = inputs
          .filter((input) => {
            const type = input.getAttribute("type") || "text";
            return !["hidden", "submit", "button", "image"].includes(type);
          })
          .map((input) => {
            const name = input.getAttribute("name") || input.getAttribute("id") || "";
            const type = input.getAttribute("type") || input.tagName.toLowerCase();
            const required =
              input.hasAttribute("required") ||
              input.getAttribute("aria-required") === "true";

            let label: string | undefined;
            const id = input.getAttribute("id");
            if (id) {
              const labelElement = form.querySelector(`label[for="${id}"]`);
              if (labelElement) {
                label = labelElement.textContent?.trim();
              }
            }

            if (!label) {
              const parentLabel = input.closest("label");
              if (parentLabel) {
                label = parentLabel.textContent?.trim();
              }
            }

            const placeholder = input.getAttribute("placeholder") || undefined;

            let options: string[] | undefined;
            if (input.tagName.toLowerCase() === "select") {
              const selectElement = input as HTMLSelectElement;
              options = Array.from(selectElement.options).map(
                (opt) => opt.value || opt.text
              );
            }

            return {
              name,
              type,
              label,
              placeholder,
              required,
              options,
            };
          });

        const submitButton =
          form.querySelector('button[type="submit"], input[type="submit"]')
            ?.textContent?.trim() || undefined;

        return {
          action,
          method,
          fields,
          submitButton,
        };
      });
    });

    return forms;
  } catch (error) {
    return [];
  }
}

export async function extractContactForm(
  page: Page
): Promise<FormStructure | null> {
  const forms = await extractForms(page);

  if (forms.length === 0) {
    return null;
  }

  if (forms.length === 1) {
    return forms[0];
  }

  // score each form to find the best one
  const scoredForms = forms.map((form) => {
    let score = 0;

    // email field is a good sign
    const hasEmail = form.fields.some(
      (f) => f.type === "email" || f.name.toLowerCase().includes("email")
    );
    if (hasEmail) score += 10;

    // message field
    const hasMessage = form.fields.some((f) => f.type === "textarea");
    if (hasMessage) score += 10;

    // name field
    const hasName = form.fields.some((f) =>
      f.name.toLowerCase().includes("name")
    );
    if (hasName) score += 5;

    // phone
    const hasPhone = form.fields.some(
      (f) => f.type === "tel" || f.name.toLowerCase().includes("phone")
    );
    if (hasPhone) score += 3;

    // reasonable number of fields
    const fieldCount = form.fields.length;
    if (fieldCount >= 3 && fieldCount <= 10) {
      score += 5;
    }

    return { form, score };
  });

  scoredForms.sort((a, b) => b.score - a.score);
  return scoredForms[0].form;
}

