// src/utils.js
import { customAlphabet } from 'nanoid';
import { AppError } from './errors.js';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET, 7); // change length if desired

export function isValidUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate a user-supplied shortcode:
 * - allow letters, digits, -, _
 * - length between 4 and 30
 */
export function validateShortcodeOrThrow(code) {
  if (typeof code !== 'string') throw new AppError('shortcode must be a string', 400, 'INVALID_SHORTCODE');
  if (!/^[\w-]{4,30}$/.test(code)) {
    throw new AppError('shortcode must be 4-30 chars and contain only letters, digits, underscore or hyphen', 400, 'INVALID_SHORTCODE');
  }
}

/** Generate auto shortcode */
export function generateShortcode() {
  return nanoid();
}

/** expiry is minutes from now; default to 30 minutes */
export function expiryFromMinutes(minutes) {
  const m = Number.isFinite(+minutes) && +minutes > 0 ? +minutes : 30;
  return new Date(Date.now() + m * 60 * 1000);
}
