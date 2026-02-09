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

        // Filter out hidden, submit, button, and image inputs
        const visibleInputs = inputs.filter((input) => {
          const type = input.getAttribute("type") || "text";
          return !["hidden", "submit", "button", "image"].includes(type);
        });

        // Group radio buttons and checkboxes by name attribute
        const fieldGroups = new Map<string, {
          type: string;
          inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];
          required: boolean;
        }>();

        visibleInputs.forEach((input) => {
          const name = input.getAttribute("name") || input.getAttribute("id") || "";
          const type = input.getAttribute("type") || input.tagName.toLowerCase();

          // Group radio and checkbox inputs by name
          if ((type === "radio" || type === "checkbox") && name) {
            if (!fieldGroups.has(name)) {
              fieldGroups.set(name, {
                type,
                inputs: [],
                required: input.hasAttribute("required") || input.getAttribute("aria-required") === "true",
              });
            }
            fieldGroups.get(name)!.inputs.push(input);
            // Update required status if any input in the group is required
            if (input.hasAttribute("required") || input.getAttribute("aria-required") === "true") {
              fieldGroups.get(name)!.required = true;
            }
          } else {
            // For non-grouped inputs, create individual entries
            const uniqueKey = name || `__unique_${Math.random()}`;
            fieldGroups.set(uniqueKey, {
              type,
              inputs: [input],
              required: input.hasAttribute("required") || input.getAttribute("aria-required") === "true",
            });
          }
        });

        // Helper function to find group label
        const findGroupLabel = (inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[]): string | undefined => {
          if (inputs.length === 0) return undefined;

          const firstInput = inputs[0];

          // Try to find fieldset legend
          const fieldset = firstInput.closest("fieldset");
          if (fieldset) {
            const legend = fieldset.querySelector("legend");
            if (legend) {
              return legend.textContent?.trim();
            }
          }

          // Try to find a common parent with a label-like element
          const parent = firstInput.parentElement;
          if (parent) {
            // Look for a label or heading before the inputs
            const siblings = Array.from(parent.children);
            const firstInputIndex = siblings.indexOf(firstInput);

            for (let i = firstInputIndex - 1; i >= 0; i--) {
              const sibling = siblings[i];
              const tagName = sibling.tagName.toLowerCase();

              if (tagName === "label" || tagName === "span" || tagName === "div" ||
                  tagName === "p" || /^h[1-6]$/.test(tagName)) {
                const text = sibling.textContent?.trim();
                if (text && text.length > 0 && text.length < 200) {
                  return text;
                }
              }
            }
          }

          // Try to find label by looking at parent's previous sibling
          const parentPrevSibling = firstInput.parentElement?.previousElementSibling;
          if (parentPrevSibling) {
            const tagName = parentPrevSibling.tagName.toLowerCase();
            if (tagName === "label" || tagName === "span" || tagName === "div" ||
                tagName === "p" || /^h[1-6]$/.test(tagName)) {
              const text = parentPrevSibling.textContent?.trim();
              if (text && text.length > 0 && text.length < 200) {
                return text;
              }
            }
          }

          return undefined;
        };

        // Helper function to get individual input label
        const getInputLabel = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | undefined => {
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

          return label;
        };

        // Convert field groups to FormField array
        const fields = Array.from(fieldGroups.entries()).map(([name, group]) => {
          const { type, inputs, required } = group;

          if (type === "radio" || (type === "checkbox" && inputs.length > 1)) {
            // Grouped radio or checkbox field
            const groupLabel = findGroupLabel(inputs);
            const options = inputs.map(input => {
              const optionLabel = getInputLabel(input);
              const value = input.getAttribute("value") || "";
              return optionLabel || value || "";
            }).filter(opt => opt.length > 0);

            return {
              name,
              type,
              label: groupLabel,
              placeholder: undefined,
              required,
              options: options.length > 0 ? options : undefined,
            };
          } else if (type === "select") {
            // Select field
            const input = inputs[0];
            const selectElement = input as HTMLSelectElement;
            const options = Array.from(selectElement.options).map(
              (opt) => opt.value || opt.text
            );
            const label = getInputLabel(input);
            const placeholder = input.getAttribute("placeholder") || undefined;

            return {
              name,
              type,
              label,
              placeholder,
              required,
              options,
            };
          } else {
            // Regular input field (text, email, tel, textarea, single checkbox, etc.)
            const input = inputs[0];
            const label = getInputLabel(input);
            const placeholder = input.getAttribute("placeholder") || undefined;

            return {
              name,
              type,
              label,
              placeholder,
              required,
              options: undefined,
            };
          }
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

