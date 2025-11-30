/**
 * API Response Interpreter for City Bus Management System
 * 
 * This utility interprets API responses and translates them into
 * user-friendly messages according to the system's guidelines.
 */

// Type definitions
export type ResponseModel<T> = {
  isSuccess: boolean;
  message: string;
  result: T | null;
};

export type ValidationErrorResponse = {
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

export type AuthResponse = {
  id?: string;
  message: string;
  isAuthenticated: boolean;
  username?: string;
  email?: string;
  roles?: string[];
  token?: string;
  refreshTokenExpiration?: string;
};

export type ApiError = {
  response?: {
    data?: ResponseModel<any> | ValidationErrorResponse | AuthResponse | { message?: string };
    status?: number;
  };
  message?: string;
};

export type UserRole = 'Passenger' | 'Driver' | 'Admin';

export type InterpretedResponse = {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  emoji: string;
};

/**
 * Maps technical error messages to user-friendly versions
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'Token is required!': 'Please log in to continue.',
  'Invalid token.': 'Your session has expired. Please log in again.',
  'Cannot book ticket for past departure time': 'This trip has already departed. Please select a future trip.',
  'Driver request submitted successfully': 'Thank you! Your driver application has been submitted and is under review.',
  'Trip cannot be ended before 2 hours of start time': 'You can only end the trip after 2 hours from the start time.',
  'Invalid username or password': 'The username or password you entered is incorrect. Please try again.',
  'Account locked due to multiple invalid attempts': 'Your account has been locked for security reasons. Please try again later or contact support.',
  'User Name Is Already Registerd': 'This username is already taken. Please choose a different one.',
  'No available seats': 'Sorry, this trip is fully booked. Would you like to see other available trips?',
  'Insufficient balance': "You don't have enough balance. Would you like to charge your wallet?",
  'No Buses Found': "We couldn't find any buses. Would you like to add one?",
};

/**
 * Maps status values to user-friendly messages
 */
const STATUS_MAP: Record<string, string> = {
  'Booked': 'Active',
  'Cancelled': 'Cancelled (refunded)',
  'Susbend': 'Pending Review',
  'Accepted': 'Approved ✅',
  'Rejected': 'Not Approved ❌',
};

/**
 * Cleans and formats field names for display
 */
const formatFieldName = (fieldName: string): string => {
  // Convert camelCase/PascalCase to readable format
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Simplifies validation error messages
 */
const simplifyValidationMessage = (message: string): string => {
  // Remove "The" prefix and "field is required" suffix variations
  let simplified = message
    .replace(/^The\s+/i, '')
    .replace(/\s+field\s+is\s+required\.?$/i, '')
    .replace(/\s+field\s+must\s+be\s+/i, 'must be ')
    .replace(/\.$/, '')
    .trim();

  // Handle common patterns
  if (message.toLowerCase().includes('required')) {
    return simplified || 'This field is required';
  }

  if (message.toLowerCase().includes('invalid email')) {
    return 'Please enter a valid email address';
  }

  if (message.toLowerCase().includes('at least')) {
    return simplified;
  }

  return simplified || message;
};

/**
 * Interprets a ResponseModel<T> response
 */
export const interpretResponseModel = <T>(
  response: ResponseModel<T>,
  context?: {
    operation?: string;
    userRole?: UserRole;
    additionalData?: any;
  }
): InterpretedResponse => {
  const { isSuccess, message } = response;
  const operation = context?.operation?.toLowerCase() || '';
  const userRole = context?.userRole || 'Passenger';

  if (isSuccess) {
    return interpretSuccessMessage(message, operation, response.result, userRole, context);
  } else {
    return interpretErrorMessage(message, operation, userRole);
  }
};

/**
 * Interprets success messages
 */
const interpretSuccessMessage = (
  message: string,
  operation: string,
  result: any,
  userRole: UserRole,
  context?: { additionalData?: any }
): InterpretedResponse => {
  let friendlyMessage = message;

  // Context-aware success messages
  if (operation.includes('book') || operation.includes('booking')) {
    friendlyMessage = 'Your ticket has been booked successfully! Your balance has been deducted. Check your notifications for details.';
  } else if (operation.includes('charge') || operation.includes('wallet')) {
    const balance = result?.balance || result?.result?.balance;
    const amount = result?.amount || context?.additionalData?.amount;
    if (balance !== undefined) {
      friendlyMessage = `Your wallet has been charged. Your new balance is ${balance} pounds.`;
    } else if (amount !== undefined) {
      friendlyMessage = `Your wallet has been charged with ${amount} pounds.`;
    } else {
      friendlyMessage = 'Your wallet has been charged successfully.';
    }
  } else if (operation.includes('schedule') || operation.includes('shift')) {
    const date = result?.date || result?.departureDate;
    const time = result?.time || result?.departureTime;
    if (date && time) {
      friendlyMessage = `A new shift has been added to the schedule on ${formatDate(date)} at ${formatTime(time)}.`;
    } else {
      friendlyMessage = 'A new shift has been added to the schedule.';
    }
  } else if (operation.includes('bus') && message.toLowerCase().includes('add')) {
    friendlyMessage = 'Great! The bus has been added successfully.';
  } else if (operation.includes('driver') && message.toLowerCase().includes('request')) {
    friendlyMessage = 'Thank you! Your driver application has been submitted and is under review.';
  } else {
    // Generic success enhancement
    if (!message.endsWith('!') && !message.endsWith('.')) {
      friendlyMessage = `${message}.`;
    }
    friendlyMessage = `Great! ${friendlyMessage}`;
  }

  return {
    message: `✅ ${friendlyMessage}`,
    type: 'success',
    emoji: '✅',
  };
};

/**
 * Interprets error messages
 */
const interpretErrorMessage = (
  message: string,
  operation: string,
  userRole: UserRole
): InterpretedResponse => {
  // Check error message map first
  const mappedMessage = ERROR_MESSAGE_MAP[message];
  if (mappedMessage) {
    return {
      message: `❌ ${mappedMessage}`,
      type: 'error',
      emoji: '❌',
    };
  }

  // Context-aware error messages
  let friendlyMessage = message;

  if (operation.includes('book') || operation.includes('booking')) {
    if (message.toLowerCase().includes('no available') || message.toLowerCase().includes('fully booked')) {
      friendlyMessage = 'Sorry, this trip is fully booked. Would you like to see other available trips?';
    } else if (message.toLowerCase().includes('past') || message.toLowerCase().includes('departed')) {
      friendlyMessage = 'This trip has already departed. Please select a future trip.';
    }
  } else if (operation.includes('wallet') || operation.includes('charge') || operation.includes('payment')) {
    if (message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('balance')) {
      friendlyMessage = "You don't have enough balance. Would you like to charge your wallet?";
    } else if (message.toLowerCase().includes('payment') || message.toLowerCase().includes('card')) {
      friendlyMessage = "The payment didn't go through. Please check your card details and try again.";
    }
  } else if (operation.includes('station') || operation.includes('route')) {
    if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('no station')) {
      friendlyMessage = "We couldn't find any stations in this area. Would you like to search in a different area?";
    }
  } else if (operation.includes('schedule')) {
    if (message.toLowerCase().includes('no') && message.toLowerCase().includes('schedule')) {
      friendlyMessage = "You don't have any active shifts right now.";
      return {
        message: `ℹ️ ${friendlyMessage}`,
        type: 'info',
        emoji: 'ℹ️',
      };
    }
  }

  // Ensure message ends properly
  if (!friendlyMessage.endsWith('.') && !friendlyMessage.endsWith('?') && !friendlyMessage.endsWith('!')) {
    friendlyMessage = `${friendlyMessage}.`;
  }

  return {
    message: `❌ ${friendlyMessage}`,
    type: 'error',
    emoji: '❌',
  };
};

/**
 * Interprets ASP.NET validation errors
 */
export const interpretValidationErrors = (
  validationResponse: ValidationErrorResponse
): InterpretedResponse => {
  const { errors } = validationResponse;

  if (!errors || Object.keys(errors).length === 0) {
    return {
      message: '❌ Please fix the validation errors.',
      type: 'error',
      emoji: '❌',
    };
  }

  const errorList = Object.entries(errors)
    .map(([fieldName, messages]) => {
      const formattedField = formatFieldName(fieldName);
      const simplifiedMessages = messages.map(simplifyValidationMessage);
      const combinedMessage = simplifiedMessages.join(' and ');
      return `- ${formattedField}: ${combinedMessage}`;
    })
    .join('\n');

  return {
    message: `❌ Please fix the following issues:\n${errorList}`,
    type: 'error',
    emoji: '❌',
  };
};

/**
 * Interprets authentication responses
 */
export const interpretAuthResponse = (
  authResponse: AuthResponse | { message: string; isAuthenticated?: boolean }
): InterpretedResponse => {
  const { message, isAuthenticated } = authResponse;

  if (isAuthenticated) {
    return {
      message: `✅ ${message || 'Authentication successful!'}`,
      type: 'success',
      emoji: '✅',
    };
  }

  // Check for specific auth error messages
  const mappedMessage = ERROR_MESSAGE_MAP[message];
  if (mappedMessage) {
    return {
      message: `❌ ${mappedMessage}`,
      type: 'error',
      emoji: '❌',
    };
  }

  return {
    message: `❌ ${message || 'Authentication failed. Please try again.'}`,
    type: 'error',
    emoji: '❌',
  };
};

/**
 * Main function to interpret any API response or error
 */
export const interpretApiResponse = (
  responseOrError: ResponseModel<any> | ValidationErrorResponse | AuthResponse | ApiError | any,
  context?: {
    operation?: string;
    userRole?: UserRole;
    additionalData?: any;
  }
): InterpretedResponse => {
  // Handle Axios errors
  if (responseOrError?.response) {
    const status = responseOrError.response.status;
    const data = responseOrError.response.data;

    // Check for validation errors
    if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      return interpretValidationErrors(data as ValidationErrorResponse);
    }

    // Check for ResponseModel
    if (data && typeof data.isSuccess === 'boolean') {
      return interpretResponseModel(data as ResponseModel<any>, context);
    }

    // Check for AuthResponse
    if (data && (typeof data.isAuthenticated === 'boolean' || data.token)) {
      return interpretAuthResponse(data as AuthResponse);
    }

    // Check for simple message in data
    if (data?.message) {
      return interpretErrorMessage(data.message, context?.operation || '', context?.userRole || 'Passenger');
    }

    // Handle generic HTTP status errors
    if (status === 400) {
      return {
        message: '❌ Invalid request. Please check your input and try again.',
        type: 'error',
        emoji: '❌',
      };
    }
    if (status === 401) {
      return {
        message: '❌ Your session has expired. Please log in again.',
        type: 'error',
        emoji: '❌',
      };
    }
    if (status === 403) {
      return {
        message: '❌ You do not have permission to perform this action.',
        type: 'error',
        emoji: '❌',
      };
    }
    if (status === 404) {
      return {
        message: '❌ The requested resource was not found.',
        type: 'error',
        emoji: '❌',
      };
    }
    if (status === 500) {
      return {
        message: '❌ A server error occurred. Please try again later.',
        type: 'error',
        emoji: '❌',
      };
    }
  }

  // Handle direct ResponseModel
  if (typeof responseOrError === 'object' && typeof responseOrError.isSuccess === 'boolean') {
    return interpretResponseModel(responseOrError as ResponseModel<any>, context);
  }

  // Handle validation errors directly
  if (typeof responseOrError === 'object' && responseOrError.errors) {
    return interpretValidationErrors(responseOrError as ValidationErrorResponse);
  }

  // Handle auth response directly
  if (typeof responseOrError === 'object' && typeof responseOrError.isAuthenticated === 'boolean') {
    return interpretAuthResponse(responseOrError as AuthResponse);
  }

  // Handle string messages
  if (typeof responseOrError === 'string') {
    return interpretErrorMessage(responseOrError, context?.operation || '', context?.userRole || 'Passenger');
  }

  // Handle error objects with message
  if (responseOrError?.message) {
    // Check if it's a generic Axios error message
    if (responseOrError.message.includes('Request failed with status code')) {
      const status = responseOrError.response?.status;
      if (status === 400) {
        return {
          message: '❌ Invalid request. Please check your input and try again.',
          type: 'error',
          emoji: '❌',
        };
      }
      if (status === 401) {
        return {
          message: '❌ Your session has expired. Please log in again.',
          type: 'error',
          emoji: '❌',
        };
      }
      // For other status codes, try to extract the actual error from response data
      if (responseOrError.response?.data?.message) {
        return interpretErrorMessage(
          responseOrError.response.data.message,
          context?.operation || '',
          context?.userRole || 'Passenger'
        );
      }
    }
    
    return interpretErrorMessage(
      responseOrError.message,
      context?.operation || '',
      context?.userRole || 'Passenger'
    );
  }

  // Default fallback
  return {
    message: '❌ Something went wrong. Please try again.',
    type: 'error',
    emoji: '❌',
  };
};

/**
 * Formats a date string to a readable format
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Formats a time string to a readable format
 */
const formatTime = (timeString: string): string => {
  try {
    // Handle ISO datetime strings
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    // Handle time-only strings (HH:mm)
    return timeString;
  } catch {
    return timeString;
  }
};

/**
 * Formats status values for display
 */
export const formatStatus = (status: string): string => {
  return STATUS_MAP[status] || status;
};

/**
 * Formats location responses (for station queries)
 */
export const interpretLocationResponse = (
  response: ResponseModel<any>,
  context?: { area?: string }
): InterpretedResponse => {
  if (response.isSuccess && response.result) {
    const result = response.result as any;
    const stationName = result.stationName || result.name;
    const distance = result.distance;
    const duration = result.duration || result.estimatedTime;

    if (stationName && distance !== undefined) {
      let message = `📍 The nearest station is ${stationName}`;
      if (distance !== undefined) {
        message += `, approximately ${distance} km away`;
        if (duration) {
          message += ` (about ${duration} minutes by car)`;
        }
      }
      message += '.';

      return {
        message,
        type: 'info',
        emoji: '📍',
      };
    }
  }

  const area = context?.area || 'this area';
  return {
    message: `❌ We couldn't find any stations in ${area}. Would you like to search in a different area?`,
    type: 'error',
    emoji: '❌',
  };
};

