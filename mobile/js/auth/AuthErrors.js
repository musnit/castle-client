export const parseSignupErrors = (e) => {
  if (e.graphQLErrors?.length) {
    return {
      global: e.graphQLErrors[0].message,
    };
  } else {
    return {
      global:
        'We could not process your request because the app appears to be offline. Please check your network connection and try again.',
    };
  }
};

export const parseErrors = (e) => {
  if (e.graphQLErrors?.length) {
    return e.graphQLErrors;
  } else {
    return [
      {
        message: e.message,
        extensions: { code: 'NETWORK_ERROR' },
      },
    ];
  }
};

export const errorMessages = {
  NETWORK_ERROR:
    'We could not process your request because the app appears to be offline. Please check your network connection and try again.',
  USER_NOT_FOUND:
    'The email or username you entered does not belong to an account. Please check your information and try again.',
  LOGIN_BAD_CREDENTIALS:
    'The password you entered was incorrect. Please check your information and try again.',
  PASSWORD_RESET_TOO_MANY:
    'There have been too many attempts to reset your password. Try again later.',
  PASSWORD_RESET_INVALID_CODE: 'The reset link you clicked on was invalid. It may have expired.',
  SIGNUP_INVALID_EMAIL: 'The email address you entered was invalid.',
  SIGNUP_INVALID_USERNAME:
    'The username you entered was invalid. Usernames must be at least three characters long and can only contain letters, numbers, and - or _.',
  SIGNUP_EMAIL_ALREADY_TAKEN:
    'There is already an account associated with the email address you entered.',
  SIGNUP_USERNAME_ALREADY_TAKEN: 'The username you entered is already taken.',
  SIGNUP_PASSWORD_TOO_SHORT:
    'The password you entered is too short. Passwords must be at least five characters long.',
};
