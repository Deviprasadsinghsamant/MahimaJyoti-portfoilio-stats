// Where the school's Cloud Functions live (mj-func, region asia-south1).
const PROJECT_ID = "mahimajyoti-1df0a";
const REGION = "asia-south1";

// Development only: EXPO_PUBLIC_FUNCTIONS_BASE_URL in .env.local points the app at the
// functions emulator, e.g. http://10.0.2.2:5001/mahimajyoti-1df0a/asia-south1 from the
// Android emulator. Release builds use the deployed functions.
export const FUNCTIONS_BASE_URL =
    process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL || `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

// The school website; Google Play requires the privacy policy to be linked inside the app.
export const WEBSITE_URL = "https://mahimajyoti-1df0a.web.app";
export const PRIVACY_POLICY_URL = `${WEBSITE_URL}/privacy`;
