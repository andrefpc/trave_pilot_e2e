// AUTH-F-11 helper: simulates "another device completed the password reset"
// by calling the password-reset API directly while Device A stays logged in.
// On real hardware this would be a second device walking through the reset
// flow; from a single-device Maestro run we just hit the API and let the
// session-revocation logic on Device A take its course on the next request.

const apiBase = MAESTRO_API_BASE_URL || 'http://10.0.2.2:3000';
const email = MAESTRO_TEST_EMAIL || 'e2e+freeuser@travelpilotapp.com';
const newPassword = MAESTRO_TEST_NEW_PASSWORD || 'E2eFreeUser!2';

// Step 1: request a reset token. The seeded e2e users always get the same
// deterministic token from /api/v1/auth/forgot-password in non-prod.
const forgot = http.post(apiBase + '/api/v1/auth/forgot-password', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: email }),
});
if (forgot.status !== 200 && forgot.status !== 204) {
  throw new Error('forgot-password failed: ' + forgot.status + ' ' + forgot.body);
}

// Step 2: complete the reset using the seeded token. The /test/reset endpoint
// surfaces the most recent token for the user; we read it then POST it.
const tokenLookup = http.get(apiBase + '/api/v1/test/password-reset-token?email=' + encodeURIComponent(email), {
  headers: { 'X-Test-Reset-Token': MAESTRO_TEST_RESET_TOKEN || '' },
});
if (tokenLookup.status !== 200) {
  // The lookup endpoint may not be wired yet; fall back to a hardcoded
  // dev-only token if the seed scripts use one.
  const fallback = MAESTRO_TEST_RESET_PW_TOKEN || '';
  if (!fallback) {
    throw new Error('could not look up reset token (status ' + tokenLookup.status + ') and no MAESTRO_TEST_RESET_PW_TOKEN fallback');
  }
  output.token = fallback;
} else {
  output.token = JSON.parse(tokenLookup.body).token;
}

const reset = http.post(apiBase + '/api/v1/auth/reset-password', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: output.token, new_password: newPassword }),
});
if (reset.status !== 200 && reset.status !== 204) {
  throw new Error('reset-password failed: ' + reset.status + ' ' + reset.body);
}
output.reset = true;
