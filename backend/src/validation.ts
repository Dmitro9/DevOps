export interface MaterialInput {
  title?: unknown;
  subject?: unknown;
  category?: unknown;
  author?: unknown;
}

export interface ValidatedMaterial {
  title: string;
  subject: string;
  category: string;
  author: string;
}

const ALLOWED_CATEGORIES = ["Конспект", "Лабораторна робота", "Методичка"];

export function validateMaterial(input: MaterialInput): {
  valid: boolean;
  data?: ValidatedMaterial;
  error?: string;
} {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const author = typeof input.author === "string" ? input.author.trim() : "";

  if (!title || !subject || !category || !author) {
    return { valid: false, error: "All fields are required" };
  }

  if (title.length > 200) {
    return { valid: false, error: "Title is too long" };
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return { valid: false, error: "Invalid category" };
  }

  return {
    valid: true,
    data: { title, subject, category, author },
  };
}