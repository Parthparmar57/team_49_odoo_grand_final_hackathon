import { AppError } from '../../middleware/error.middleware.js';

/**
 * Safe, deterministic mathematical formula evaluator for salary rules.
 * Does NOT use eval() or Function().
 * Supports variables: BASIC, GROSS, WORKED_DAYS, WORKING_DAYS, WAGE
 * Supports operators: +, -, *, /, (, ) and numbers
 */
export class FormulaEvaluator {
    static ALLOWED_VARIABLES = ['BASIC', 'GROSS', 'WORKED_DAYS', 'WORKING_DAYS', 'WAGE'];

    /**
     * Validate formula string for unsafe or illegal tokens.
     */
    static validateFormula(formula) {
        if (!formula || typeof formula !== 'string' || formula.trim() === '') {
            throw new AppError('Formula string cannot be empty', 400, 'INVALID_FORMULA');
        }

        // Sanitize & tokenize
        const tokens = formula.toUpperCase().match(/([A-Z_]+|\d+(?:\.\d+)?|[\+\-\*\/\(\)])/g);
        if (!tokens || tokens.join('') !== formula.toUpperCase().replace(/\s+/g, '')) {
            throw new AppError('Formula contains invalid or unsafe characters', 400, 'INVALID_FORMULA');
        }

        for (const token of tokens) {
            if (/^[A-Z_]+$/.test(token)) {
                if (!this.ALLOWED_VARIABLES.includes(token)) {
                    throw new AppError(`Unsupported variable in formula: '${token}'. Allowed: ${this.ALLOWED_VARIABLES.join(', ')}`, 400, 'UNSUPPORTED_FORMULA_VARIABLE');
                }
            }
        }

        return true;
    }

    /**
     * Evaluate formula with a given context dictionary.
     * context = { BASIC: 40000, GROSS: 50000, WORKED_DAYS: 22, WORKING_DAYS: 22, WAGE: 40000 }
     */
    static evaluate(formula, context = {}) {
        this.validateFormula(formula);

        // Replace allowed variables with numbers from context
        const tokens = formula.toUpperCase().match(/([A-Z_]+|\d+(?:\.\d+)?|[\+\-\*\/\(\)])/g);
        const resolvedTokens = tokens.map((token) => {
            if (this.ALLOWED_VARIABLES.includes(token)) {
                const val = context[token] !== undefined ? Number(context[token]) : 0;
                return val.toString();
            }
            return token;
        });

        // Evaluate token list using Shunting Yard / RPN algorithm
        const rpn = this.toRPN(resolvedTokens);
        const result = this.evalRPN(rpn);

        if (isNaN(result) || !isFinite(result)) {
            throw new AppError('Formula evaluation resulted in invalid number (division by zero)', 400, 'INVALID_FORMULA_RESULT');
        }

        return Math.round(result * 100) / 100;
    }

    static toRPN(tokens) {
        const outputQueue = [];
        const operatorStack = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

        for (const token of tokens) {
            if (!isNaN(parseFloat(token))) {
                outputQueue.push(parseFloat(token));
            } else if (['+', '-', '*', '/'].includes(token)) {
                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
                    precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
                ) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push(token);
            } else if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length === 0) {
                    throw new AppError('Mismatched parentheses in formula', 400, 'INVALID_FORMULA');
                }
                operatorStack.pop(); // Pop '('
            }
        }

        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            if (op === '(' || op === ')') {
                throw new AppError('Mismatched parentheses in formula', 400, 'INVALID_FORMULA');
            }
            outputQueue.push(op);
        }

        return outputQueue;
    }

    static evalRPN(rpnQueue) {
        const stack = [];

        for (const token of rpnQueue) {
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                if (stack.length < 2) {
                    throw new AppError('Invalid expression syntax in formula', 400, 'INVALID_FORMULA');
                }
                const b = stack.pop();
                const a = stack.pop();

                switch (token) {
                    case '+':
                        stack.push(a + b);
                        break;
                    case '-':
                        stack.push(a - b);
                        break;
                    case '*':
                        stack.push(a * b);
                        break;
                    case '/':
                        if (b === 0) throw new AppError('Division by zero in formula', 400, 'DIVISION_BY_ZERO');
                        stack.push(a / b);
                        break;
                }
            }
        }

        if (stack.length !== 1) {
            throw new AppError('Invalid formula syntax', 400, 'INVALID_FORMULA');
        }

        return stack[0];
    }
}
