// Invoked from flows/common/_reset_data.yaml via Maestro's runScript.
// Maestro's JS env exposes `http`, `output`, and the resolved `MAESTRO_*` env.
// We POST to /api/v1/test/reset, which is mounted only when NODE_ENV !== 'production'.

const apiBase = MAESTRO_API_BASE_URL || 'http://10.0.2.2:3000';
const token = MAESTRO_TEST_RESET_TOKEN || '';

const response = http.post(apiBase + '/api/v1/test/reset', {
  headers: {
    'X-Test-Reset-Token': token,
    'Content-Type': 'application/json',
  },
  body: '{}',
});

if (response.status !== 200) {
  throw new Error('test/reset failed: ' + response.status + ' ' + response.body);
}
output.reset = JSON.parse(response.body);
