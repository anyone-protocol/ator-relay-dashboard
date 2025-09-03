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

export const isValidNumericInput = (input: string) => {
  if (!input) return false;
  // Allows integers, decimals with single '.', and thousands with single ',' (e.g., '12,507' or '4.0004')
  const regex = /^[0-9]+([,][0-9]{3})*([.][0-9]+)?$/;
  return (
    regex.test(input.replace(/,/g, '')) || /^[0-9]+([.][0-9]+)?$/.test(input)
  );
};
