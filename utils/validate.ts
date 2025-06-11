export const validateTokenInput = (value: string): string | null => {
  // remove commas, trim whitespace
  const cleanedValue = value.replace(/,/g, '').trim();
  if (!cleanedValue) return '0';

  try {
    const numValue = parseFloat(cleanedValue);
    if (numValue <= 0) return null;

    return cleanedValue.toString();
  } catch {
    return null;
  }
};
