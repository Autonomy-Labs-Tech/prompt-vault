<?php
// Legacy IONOS webhook intentionally disabled.
// Use api/fulfill.js only after Stripe webhook signing and Resend credentials
// are configured in the deployment environment.
http_response_code(410);
header('Content-Type: application/json');
echo json_encode(['ok' => false, 'error' => 'legacy fulfillment endpoint disabled']);
