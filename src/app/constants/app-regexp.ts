const APP_REGEXP = {
    USER_NAME: {
        REGEXP: /^(?!\s)(?!\s)(?!.*\s{2})(?!.*\s$).*$/,
        MESSAGE: 'Spaces cannot be at the beginning or end, and consecutive spaces are not allowed.',
        MIN_LENGTH: 6,
        MIN_LENGTH_MESSAGE: 'Please enter at least 6 characters.',
    },
    IP_ADDRESS: {
        REGEXP: /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/,
        MESSAGE: 'Please enter a valid IP address.',
    },
    PANNA: {
        REGEXP: /^[1-9]\d*$/,
        MESSAGE: 'Please enter a valid panna.',
    },
};

export default APP_REGEXP;