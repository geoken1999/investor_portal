import { z } from "zod";

/**
 * Validates a monetary/rate value as a decimal STRING and keeps it a
 * string all the way to the database — never parsed through `Number()`,
 * which would reintroduce float precision loss. Postgres `numeric` parses
 * the string representation directly.
 */
export const decimalString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+(\.\d{1,4})?$/, `${label} must be a positive number`);
