export const validateTokenInput = (value: string): string | null => {
  // remove commas, trim whitespace
  const cleanedValue = value.replace(/,/g, '').trim();
  if (!cleanedValue) return null;

  if (
    !cleanedValue ||
    isNaN(Number(cleanedValue)) ||
    Number(cleanedValue) < 0
  ) {
    return null;
  }

  try {
    const numValue = parseFloat(cleanedValue);
    if (numValue <= 0) return null;

    return cleanedValue.toString();
  } catch {
    return null;
  }
};
