import "server-only";
import { randomInt } from "node:crypto";

const LOWER = "abcdefghjkmnpqrstuvwxyz"; // no i/l/o — avoid look-alikes
const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789"; // no 0/1 — avoid look-alikes with O/I

function pick(chars: string) {
  return chars[randomInt(chars.length)];
}

/**
 * A random temporary password satisfying the app's own strength rules
 * (see decimalString-style validators in lib/validations/auth.ts:
 * 8+ chars, upper, lower, digit). Shown once to the admin after creating an
 * investor account — the admin is expected to hand it to the investor
 * out-of-band, and the investor changes it from their Profile page.
 */
export function generateTemporaryPassword(): string {
  const all = LOWER + UPPER + DIGITS;
  const required = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  const rest = Array.from({ length: 7 }, () => pick(all));
  const chars = [...required, ...rest];

  // Fisher-Yates shuffle so the required characters aren't always at the front.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
