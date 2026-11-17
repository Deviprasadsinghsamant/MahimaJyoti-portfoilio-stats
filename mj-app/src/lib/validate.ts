// Same rules as the server (mj-func/src/domains/parents/handlers.ts), so most
// typos are caught before a network call.

/** "mj 0042" → "MJ0042", or null if it isn't a Student ID. */
export function normalizeStudentCode(raw: string): string | null {
    const code = raw.trim().toUpperCase().replace(/\s+/g, "");
    return /^MJ\d{4,6}$/.test(code) ? code : null;
}

// Keep in sync with PHONE_EMAIL_DOMAIN / phoneToEmail in mj-web/lib/auth.ts.
const PHONE_EMAIL_DOMAIN = "mahimajyoti.internal";

/**
 * A teacher's phone number as typed on the website's login page → their login's
 * email: a 10-digit number gets +91; a number starting with + keeps its country code.
 */
export function staffLoginEmail(raw: string): string | null {
    const trimmed = raw.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (trimmed.startsWith("+")) {
        return digits.length >= 10 && digits.length <= 15 ? `${digits}@${PHONE_EMAIL_DOMAIN}` : null;
    }
    if (digits.length === 10) return `91${digits}@${PHONE_EMAIL_DOMAIN}`;
    if (digits.length === 12 && digits.startsWith("91")) return `${digits}@${PHONE_EMAIL_DOMAIN}`;
    return null;
}

/** "+91 98765 43210" → "9876543210", or null if it isn't an Indian mobile number. */
export function normalizeMobile(raw: string): string | null {
    let digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
