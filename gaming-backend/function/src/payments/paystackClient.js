const { AppError, ERROR_CODES } = require("../utils/errors");

function createPaystackClient({
  secretKey,
  baseUrl = "https://api.paystack.co",
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
}) {
  if (!secretKey) {
    throw new Error("Paystack secret key is required.");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("A valid fetch implementation is required.");
  }

  async function verifyTransaction(reference) {
    if (
      typeof reference !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(reference)
    ) {
      throw new AppError(
        ERROR_CODES.INVALID_ARGUMENT,
        "Invalid transaction reference."
      );
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetchImpl(
        `${baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new AppError(
          ERROR_CODES.UNAVAILABLE,
          "Paystack returned an invalid response."
        );
      }

      if (!response.ok || result.status !== true || !result.data) {
        throw new AppError(
          ERROR_CODES.UNAVAILABLE,
          result.message || "Unable to verify Paystack transaction."
        );
      }

      const data = result.data;

      if (
        data.status !== "success" ||
        data.reference !== reference ||
        !Number.isSafeInteger(data.amount) ||
        data.amount <= 0 ||
        data.currency !== "NGN"
      ) {
        throw new AppError(
          ERROR_CODES.FAILED_PRECONDITION,
          "Paystack transaction details are invalid."
        );
      }

      return {
        status: data.status,
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AppError(
          ERROR_CODES.UNAVAILABLE,
          "Paystack verification request timed out."
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    verifyTransaction,
  };
}

module.exports = {
  createPaystackClient,
};
