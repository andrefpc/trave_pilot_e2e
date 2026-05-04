// Invoked from flows/common/_reset_data.yaml via Maestro's runScript.
// Maestro's JS env exposes `http`, `output`, and the resolved `MAESTRO_*` env.
// We POST to /api/v1/test/reset, which is mounted only when NODE_ENV !== 'production'.

// Soft-fail: if /test/reset isn't available (e.g., we're hitting production
// where the endpoint isn't mounted) just log it and let the flow continue.
// Flows that genuinely need a clean state can wipe via launchApp clearState.
const apiBase = MAESTRO_API_BASE_URL || 'http://10.0.2.2:3000';
const token = MAESTRO_TEST_RESET_TOKEN || '';

if (!token) {
  output.reset = { skipped: true, reason: 'no MAESTRO_TEST_RESET_TOKEN' };
} else {
  const response = http.post(apiBase + '/api/v1/test/reset', {
    headers: {
      'X-Test-Reset-Token': token,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (response.status === 200) {
    output.reset = JSON.parse(response.body);
  } else {
    output.reset = { skipped: true, status: response.status };
  }
}
