export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function parseOptionalPositionValue(rawValue: FormDataEntryValue | null) {
  const raw = String(rawValue ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getNextPosition<T extends { position: number }>(rows: T[]) {
  return rows.reduce((max, row) => Math.max(max, row.position), 0) + 1;
}

export function assertMutationSucceeded<T>(
  result: { data: T | null; error: { message: string } | null },
  fallbackMessage: string
) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    throw new Error(fallbackMessage);
  }

  return result.data;
}
