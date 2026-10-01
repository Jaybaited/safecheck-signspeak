export const PASSWORD_HINT =
  'Use 8 to 64 characters with an uppercase letter, a lowercase letter, a number, and a special character.';

// Returns EVERY requirement the password is still missing.
export function getPasswordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 8)              problems.push('at least 8 characters');
  if (!/[A-Z]/.test(password))          problems.push('an uppercase letter');
  if (!/[a-z]/.test(password))          problems.push('a lowercase letter');
  if (!/\d/.test(password))             problems.push('a number');
  if (!/[^A-Za-z0-9]/.test(password))   problems.push('a special character');
  return problems;
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function validateNewPassword(password: string): string | null {
  if (!password)             return 'New password is required.';
  if (password.length > 64)  return 'Password must not exceed 64 characters.';
  const problems = getPasswordProblems(password);
  if (problems.length === 0) return null;
  return `Password must include ${joinList(problems)}.`;
}