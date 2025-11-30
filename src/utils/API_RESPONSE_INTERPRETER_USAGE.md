# API Response Interpreter Usage Guide

This guide shows how to use the API Response Interpreter to get user-friendly messages from API responses.

## Basic Usage

### Using the Enhanced Error Handler

```typescript
import { createFriendlyErrorWithContext, getInterpretedResponse } from '../utils/errorHandler';

// In a try-catch block
try {
  const response = await someService.someOperation();
  // Handle success
} catch (error) {
  // Get user-friendly error message with context
  const friendlyError = createFriendlyErrorWithContext(error, {
    operation: 'book trip',
    userRole: 'Passenger'
  });
  setError(friendlyError.message);
}
```

### Getting Full Response Details

```typescript
import { getInterpretedResponse } from '../utils/errorHandler';

// For API responses (success or error)
const interpreted = getInterpretedResponse(apiResponse, {
  operation: 'charge wallet',
  userRole: 'Passenger',
  additionalData: { amount: 100 }
});

// interpreted.message contains the formatted message with emoji
// interpreted.type is 'success' | 'error' | 'warning' | 'info'
// interpreted.emoji is the emoji used

console.log(interpreted.message);
// Example: "✅ Your wallet has been charged with 100 pounds."
```

## Examples

### Handling ResponseModel<T> Responses

```typescript
import { interpretApiResponse } from '../utils/apiResponseInterpreter';

const response = {
  isSuccess: false,
  message: "No available seats.",
  result: null
};

const interpreted = interpretApiResponse(response, {
  operation: 'book trip',
  userRole: 'Passenger'
});

// interpreted.message: "❌ Sorry, this trip is fully booked. Would you like to see other available trips?"
```

### Handling Validation Errors

```typescript
const validationError = {
  title: "One or more validation errors occurred.",
  status: 400,
  errors: {
    "Name": ["The Name field is required.", "At Least three Letters"],
    "Email": ["In Valid Email"]
  }
};

const interpreted = interpretApiResponse(validationError);

// interpreted.message will be:
// "❌ Please fix the following issues:
// - Name: This field is required and must be at least 3 letters
// - Email: Please enter a valid email address"
```

### Handling Authentication Responses

```typescript
const authResponse = {
  message: "Login successful",
  isAuthenticated: true,
  username: "john_doe",
  token: "jwt-token"
};

const interpreted = interpretApiResponse(authResponse);

// interpreted.message: "✅ Login successful"
```

### Updating Existing Code

**Before:**
```typescript
try {
  const res = await authService.login(userName, password);
  // ...
} catch (err) {
  logError(err);
  setError(createFriendlyError(err).message);
}
```

**After:**
```typescript
try {
  const res = await authService.login(userName, password);
  // ...
} catch (err) {
  logError(err);
  setError(createFriendlyErrorWithContext(err, {
    operation: 'login',
    userRole: 'Passenger'
  }).message);
}
```

## Context Options

The context parameter accepts:
- `operation`: The operation being performed (e.g., 'book trip', 'charge wallet')
- `userRole`: The user's role ('Passenger', 'Driver', 'Admin')
- `additionalData`: Any additional data needed for context-aware messages

## Response Types

The interpreter handles:
- `ResponseModel<T>` - Standard API responses with isSuccess, message, result
- `ValidationErrorResponse` - ASP.NET validation errors
- `AuthResponse` - Authentication responses
- Axios errors - HTTP errors with response data
- Plain error objects - Generic error objects

