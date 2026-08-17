/**
 * Shared Input & Auth Validation Utilities
 */

/** Validate email format */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes('@') && trimmed.includes('.');
}

/** Password requirements evaluation */
export function getPasswordRequirements(password = '') {
  return {
    passLength: password.length >= 8,
    passHasNumber: /\d/.test(password),
  };
}

/** Validate full name string */
export function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2;
}
