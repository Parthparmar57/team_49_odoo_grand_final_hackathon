import { AppError } from '../middleware/error.middleware.js';

export class Validator {
    static isEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email.trim());
    }

    static isBankAccountNumber(accountNo) {
        if (!accountNo) return true; // Optional field, but if provided must be numeric digits only
        const re = /^\d{9,18}$/;
        return re.test(String(accountNo).trim());
    }

    static isIFSC(ifscCode) {
        if (!ifscCode) return true;
        const re = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return re.test(String(ifscCode).trim().toUpperCase());
    }

    static isPhone(phone) {
        if (!phone) return true;
        const re = /^\+?[0-9\s-]{8,15}$/;
        return re.test(String(phone).trim());
    }

    static isTaxId(taxId) {
        if (!taxId) return true;
        const re = /^[A-Z0-9]{5,15}$/;
        return re.test(String(taxId).trim().toUpperCase());
    }

    static isEmployeeNumber(empNo) {
        if (!empNo || typeof empNo !== 'string') return false;
        const re = /^[a-zA-Z0-9_-]{2,30}$/;
        return re.test(empNo.trim());
    }

    static validateUserPayload(data) {
        const errors = [];
        if (!data.email || !this.isEmail(data.email)) {
            errors.push('A valid email address is required (e.g. user@peoplepay360.com)');
        }
        if (data.password && data.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
        if (errors.length > 0) {
            throw new AppError(errors.join('. '), 400, 'VALIDATION_ERROR', errors);
        }
    }

    static validateEmployeePayload(data) {
        const errors = [];
        if (!data.firstName || !data.firstName.trim()) {
            errors.push('First name is required');
        }
        if (!data.lastName || !data.lastName.trim()) {
            errors.push('Last name is required');
        }
        if (!data.email || !this.isEmail(data.email)) {
            errors.push('A valid work email address is required (e.g. alex@company.com)');
        }
        if (!data.employeeNumber || !this.isEmployeeNumber(data.employeeNumber)) {
            errors.push('Employee ID must be 2–30 alphanumeric characters (e.g. EMP-101)');
        }
        if (!data.designation || !data.designation.trim()) {
            errors.push('Designation is required');
        }
        if (data.accountNumber && !this.isBankAccountNumber(data.accountNumber)) {
            errors.push('Bank Account Number must contain only digits (9 to 18 numbers, no letters)');
        }
        if (data.ifscCode && !this.isIFSC(data.ifscCode)) {
            errors.push('IFSC Code must be an 11-character code (e.g. SBIN0001234)');
        }
        if (data.phone && !this.isPhone(data.phone)) {
            errors.push('Phone number must be 8 to 15 digits');
        }
        if (data.taxId && !this.isTaxId(data.taxId)) {
            errors.push('Tax ID / PAN must be 5 to 15 alphanumeric characters');
        }

        if (errors.length > 0) {
            throw new AppError(errors.join('. '), 400, 'VALIDATION_ERROR', errors);
        }
    }
}
