const APP_REGEXP = {
    USER_NAME: {
        REGEXP: /^[a-zA-Z][a-zA-Z0-9_]{5,}$/,
        MESSAGE: 'Invalid user name. It should start with a letter and contain only letters, numbers, and underscores and be at least 6 characters long.',
    },
};

export default APP_REGEXP;