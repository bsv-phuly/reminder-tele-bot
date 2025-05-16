import { Request, Response, NextFunction } from 'express';

// Middleware to check for missing query parameters or request body
export const validateRequestParams = (requiredParams: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const param of requiredParams) {
            if (!req.body[param] && !req.params[param] && !req.query[param]) {
                return res.status(400).json({
                    error: `Missing required parameter: ${param}`,
                });
            }
        }
        next(); // If no missing parameters, proceed to the next handler
    };
};
