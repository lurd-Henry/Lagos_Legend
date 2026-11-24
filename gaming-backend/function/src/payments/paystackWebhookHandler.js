const {
  verifyPaystackSignature,
} = require("./paymentValidation");

const { normalizeError } = require("../utils/errors");

function createPaystackWebhookHandler({
  secretKey,
  processEvent,
  logger = console,
}) {
  if (!secretKey || !processEvent) {
    throw new Error(
      "secretKey and processEvent are required."
    );
  }

  return async function paystackWebhookHandler(req, res) {
    try {
      const signature =
        req.get?.("x-paystack-signature") ||
        req.headers?.["x-paystack-signature"];

      // Firebase HTTPS requests expose the original body as rawBody.
      const rawBody = req.rawBody;

      if (!Buffer.isBuffer(rawBody)) {
        return res.status(400).json({
          success: false,
          message: "Original request body is required.",
        });
      }

      const signatureIsValid = verifyPaystackSignature(
        rawBody,
        signature,
        secretKey
      );

      if (!signatureIsValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid webhook signature.",
        });
      }

      let event;

      try {
        event = JSON.parse(rawBody.toString("utf8"));
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON payload.",
        });
      }

      const result = await processEvent(event);

      // Successful processing, including safe duplicate handling.
      return res.status(200).json({
        success: true,
        result,
      });
    } catch (error) {
      const normalized = normalizeError(error);

      // Log useful diagnostic information, never the secret key.
      logger.error?.("Paystack webhook processing failed", {
        code: normalized.code,
        message: normalized.message,
      });

      // 500 tells Paystack that processing failed and may be retried.
      return res.status(500).json({
        success: false,
        message: "Webhook processing failed.",
      });
    }
  };
}

module.exports = {
  createPaystackWebhookHandler,
};
