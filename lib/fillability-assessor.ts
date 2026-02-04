// figure out if we can auto-fill the form
import {
  FormStructure,
  FormField,
  FillabilityStatus,
  ContactDataMapping,
} from "./types";

// fields we know how to fill
const STANDARD_CONTACT_FIELDS = {
  name: ["name", "fullname", "full_name", "your_name", "氏名", "お名前"],
  email: ["email", "mail", "e-mail", "メール", "メールアドレス"],
  phone: ["phone", "tel", "telephone", "mobile", "電話", "電話番号"],
  company: ["company", "organization", "会社", "会社名", "企業名"],
  message: ["message", "inquiry", "comment", "content", "お問い合わせ内容", "メッセージ"],
  subject: ["subject", "title", "件名", "タイトル"],
};

function mapFieldToContactData(field: FormField): string | null {
  const fieldIdentifier = (
    field.name +
    " " +
    (field.label || "") +
    " " +
    (field.placeholder || "")
  ).toLowerCase();

  for (const [contactField, keywords] of Object.entries(
    STANDARD_CONTACT_FIELDS
  )) {
    if (
      keywords.some((keyword) => fieldIdentifier.includes(keyword.toLowerCase()))
    ) {
      return contactField;
    }
  }

  // fallback to type checking
  if (field.type === "email") return "email";
  if (field.type === "tel") return "phone";
  if (field.type === "textarea") return "message";

  return null;
}

// check if we can fill this form
export function assessFillability(form: FormStructure): {
  status: FillabilityStatus;
  mappedFields: ContactDataMapping;
  unmappedRequiredFields: string[];
} {
  const mappedFields: ContactDataMapping = {};
  const unmappedRequiredFields: string[] = [];
  const requiredFields = form.fields.filter((f) => f.required);

  for (const field of form.fields) {
    const mapping = mapFieldToContactData(field);
    if (mapping) {
      mappedFields[mapping] = field.name;
    } else if (field.required) {
      unmappedRequiredFields.push(
        field.label || field.name || field.placeholder || "Unknown field"
      );
    }
  }

  let status: FillabilityStatus;

  if (requiredFields.length === 0) {
    status = FillabilityStatus.FULL;
  } else if (unmappedRequiredFields.length === 0) {
    status = FillabilityStatus.FULL;
  } else if (Object.keys(mappedFields).length > 0) {
    status = FillabilityStatus.PARTIAL;
  } else {
    status = FillabilityStatus.NONE;
  }

  return {
    status,
    mappedFields,
    unmappedRequiredFields,
  };
}

export function getFillabilityPercentage(form: FormStructure): number {
  const requiredFields = form.fields.filter((f) => f.required);

  if (requiredFields.length === 0) {
    return 100;
  }

  const mappedCount = requiredFields.filter(
    (field) => mapFieldToContactData(field) !== null
  ).length;

  return Math.round((mappedCount / requiredFields.length) * 100);
}

export function getFieldMappingReport(form: FormStructure): {
  totalFields: number;
  requiredFields: number;
  mappedFields: number;
  unmappedFields: number;
  mappingDetails: Array<{
    field: string;
    type: string;
    required: boolean;
    mapped: boolean;
    mappedTo?: string;
  }>;
} {
  const mappingDetails = form.fields.map((field) => {
    const mapping = mapFieldToContactData(field);
    return {
      field: field.label || field.name || field.placeholder || "Unknown",
      type: field.type,
      required: field.required,
      mapped: mapping !== null,
      mappedTo: mapping || undefined,
    };
  });

  const requiredFields = form.fields.filter((f) => f.required).length;
  const mappedFields = mappingDetails.filter((d) => d.mapped).length;

  return {
    totalFields: form.fields.length,
    requiredFields,
    mappedFields,
    unmappedFields: form.fields.length - mappedFields,
    mappingDetails,
  };
}

