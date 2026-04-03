const NETWORK_ERROR_MESSAGES = [
  "failed to fetch",
  "fetch failed",
  "networkerror when attempting to fetch resource",
  "load failed",
  "network request failed",
  "enotfound",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
}

export function formatAuthError(error: unknown, fallbackMessage: string) {
  const message = getErrorMessage(error)?.trim();

  if (!message) {
    return fallbackMessage;
  }

  const normalizedMessage = message.toLowerCase();

  if (NETWORK_ERROR_MESSAGES.some((candidate) => normalizedMessage.includes(candidate))) {
    return "The sign-in service is temporarily unreachable. Please try again in a few minutes.";
  }

  if (normalizedMessage.includes("supabase environment variables are not configured")) {
    return "The sign-in service is not configured correctly right now. Please contact support.";
  }

  return message;
}
