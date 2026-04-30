/**
 * Utility to map technical error messages/codes to user-friendly English messages.
 */

export function getFriendlyErrorMessage(error: any): string {
  // If it's a string, try to map common patterns
  if (typeof error === 'string') {
    return mapTechnicalStringToFriendly(error);
  }

  // If it's an Axios error or has a response
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Specific mapping for common HTTP status codes
    switch (status) {
      case 400:
        return data?.error || data?.message || "There was a problem with your request. Please check your input.";
      case 401:
        return "Your session has expired or you are not authorized. Please log in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested information could not be found.";
      case 409:
        return "This record already exists in our system.";
      case 422:
        return "Some information you provided is invalid. Please check the form.";
      case 429:
        return "Too many requests. Please slow down and try again in a moment.";
      case 500:
        return "Something went wrong on our end. Our team has been notified.";
      case 502:
      case 503:
      case 504:
        return "The server is currently unavailable. Please check your internet or try again later.";
      default:
        break;
    }

    // Try to map the error message from the response data if available
    if (data?.error && typeof data.error === 'string') {
      return mapTechnicalStringToFriendly(data.error);
    }
  }

  // Handle network errors (no response)
  if (error?.request && !error?.response) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return mapTechnicalStringToFriendly(error.message);
  }

  // Fallback
  return "An unexpected error occurred. Please try again.";
}

function mapTechnicalStringToFriendly(techMsg: string): string {
  const msg = techMsg.toLowerCase();

  // Database Constraints
  if (msg.includes('unique constraint') || msg.includes('already exists')) {
    if (msg.includes('email')) return "This email address is already in use.";
    if (msg.includes('phone')) return "This phone number is already registered.";
    if (msg.includes('name')) return "This name is already taken. Please use a unique name.";
    return "This record already exists in the system.";
  }

  if (msg.includes('foreign key constraint') || msg.includes('is still referenced')) {
    return "This item cannot be deleted because it is being used by other parts of the system.";
  }

  if (msg.includes('violates check constraint')) {
    return "The information provided does not meet the required format or rules.";
  }

  if (msg.includes('null value in column')) {
    return "Some required information is missing. Please fill in all mandatory fields.";
  }

  // Authentication & Session
  if (msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
    return "The email or password you entered is incorrect.";
  }

  if (msg.includes('token expired') || msg.includes('unauthorized')) {
    return "Your session has expired. Please sign in again.";
  }

  // Network/Connection
  if (msg.includes('network error') || msg.includes('failed to fetch')) {
    return "Network error. Please check your internet connection and try again.";
  }

  if (msg.includes('timeout')) {
    return "The request took too long to complete. Please try again.";
  }

  // File handling
  if (msg.includes('file too large')) {
    return "The file you are trying to upload is too large. Please use a smaller file.";
  }

  if (msg.includes('invalid file type')) {
    return "This file type is not supported. Please upload a valid file format.";
  }

  // Logic errors
  if (msg.includes('insufficient sms balance') || msg.includes('not enough credits')) {
    return "You do not have enough SMS credits to send this message. Please top up your balance.";
  }

  // Default: if the message is already somewhat friendly (short and simple), keep it
  if (techMsg.length < 50 && !techMsg.includes('_') && !techMsg.includes('constraint')) {
    return techMsg;
  }

  // Generic polite fallback
  return "We encountered an issue while processing your request. Please try again.";
}
