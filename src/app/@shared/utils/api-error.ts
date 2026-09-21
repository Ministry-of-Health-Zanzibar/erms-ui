export function getApiErrorMessage(error: unknown, fallback: string): string {
  const response = error as {
    error?: {
      message?: unknown;
      errors?: Record<string, unknown>;
    };
    message?: unknown;
  };

  const validationErrors = response?.error?.errors;
  if (validationErrors) {
    for (const value of Object.values(validationErrors)) {
      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }

  if (typeof response?.error?.message === 'string' && response.error.message.trim()) {
    return response.error.message;
  }

  if (typeof response?.message === 'string' && response.message.trim()) {
    return response.message;
  }

  return fallback;
}
