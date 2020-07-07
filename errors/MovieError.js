class MovieError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MovieError';
        Error.captureStackTrace(this, MovieError)
    }
};

module.exports = MovieError;
