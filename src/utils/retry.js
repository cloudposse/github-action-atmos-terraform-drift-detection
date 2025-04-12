const wrapWithRetry = async (octoCall, options = {}) => {
    const {
        // GitHub support advises:
        // If the response includes a Retry-After header,
        // you should wait for the specified number of seconds before retrying.
        // If your response does not include a Retry-After header, follow these guidelines:
        // * Wait at least one minute before retrying.
        // * If the request continues to fail, implement exponential backoff
        // * After a specific number of retries (e.g., 5 attempts), throw an error

        maxRetries = 4,
        retryDelay = 67 * 1000, // 67 seconds
        shouldRetry = (error) => {
            // Specifically handle secondary rate limits (403 with specific message)
            const isRateLimit =
                (error.status === 403 || error.status == 429) &&
                (error.message.includes('rate limit') ||
                    error.message.includes('secondary limit'));
            // Also retry on 500 errors and network issues
            const isServerError = error.status >= 500;
            return isRateLimit || isServerError;
        }
    } = options;

    let retries = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await octoCall();
        } catch (error) {
            retries++;
            const errorMessage = error?.message || 'Unknown error';
            const statusCode =
                error?.status || error?.response?.status || 'Unknown status';

            if (retries > maxRetries || !shouldRetry(error)) {
                console.log(
                    `Failed after ${retries} retries. Last error: ${statusCode} - ${errorMessage}`
                );
                throw error;
            }

            // Calculate backoff with exponential increase
            let delay = retryDelay * Math.pow(2, retries - 1);
            // Use Retry-After if present
            const retryAfter = error.response?.headers['retry-after'];
            if (retryAfter) {
                const retryAfterSeconds = parseInt(retryAfter, 10);
                if (!isNaN(retryAfterSeconds)) {
                    delay = retryAfterSeconds * 1000;
                }
            }
            console.log(
                `Retry attempt #${retries} for status ${statusCode}: ${errorMessage}. Waiting ${delay / 1000}s...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

module.exports = {
    wrapWithRetry
};
