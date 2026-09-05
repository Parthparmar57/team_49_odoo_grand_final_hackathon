import { ApiResponse } from '../utils/responseFormatter.js';

export function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            const details = error.errors ? error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) : error.message;
            return ApiResponse.error(res, 'Validation Error', 'VALIDATION_ERROR', 400, details);
        }
    };
}
