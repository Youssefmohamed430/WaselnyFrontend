import { interpretApiResponse, type InterpretedResponse, type UserRole } from './apiResponseInterpreter';

type FriendlyError = {
  message: string;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use createFriendlyErrorWithContext instead for better error messages
 */
export const createFriendlyError = (error: unknown): FriendlyError => {
  if (typeof error === 'string') return { message: error };
  if (error && typeof error === 'object') {
    const anyErr = error as any;
    if (anyErr.response?.data?.message) {
      return { message: anyErr.response.data.message as string };
    }
    if (anyErr.message) {
      return { message: anyErr.message as string };
    }
  }
  return { message: 'Something went wrong. Please try again.' };
};

/**
 * Enhanced error handler that uses the API response interpreter
 * Provides user-friendly, context-aware error messages
 */
export const createFriendlyErrorWithContext = (
  error: unknown,
  context?: {
    operation?: string;
    userRole?: UserRole;
    additionalData?: any;
  }
): FriendlyError => {
  const interpreted = interpretApiResponse(error, context);
  return { message: interpreted.message };
};

/**
 * Get interpreted response from API response or error
 * Returns a structured response with message, type, and emoji
 */
export const getInterpretedResponse = (
  responseOrError: unknown,
  context?: {
    operation?: string;
    userRole?: UserRole;
    additionalData?: any;
  }
): InterpretedResponse => {
  return interpretApiResponse(responseOrError, context);
};

export const logError = (error: unknown) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};


