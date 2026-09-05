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
        // Indian 10-digit mobile number format or standard 10-digit mobile number
        const cleanPhone = String(phone).replace(/[\s\-\+\(\)]/g, '');
        const re = /^[6-9]\d{9}$/;
        const reGenericTen = /^\d{10}$/;
        return re.test(cleanPhone) || reGenericTen.test(cleanPhone);
    }

    static isPinCode(pinCode) {
        if (!pinCode) return true;
        const re = /^\d{6}$/;
        return re.test(String(pinCode).trim());
    }

    static isTaxId(taxId) {
        if (!taxId) return true;
        // Indian PAN format: 5 letters + 4 digits + 1 letter, or 5-15 alphanumeric
        const cleanTax = String(taxId).trim().toUpperCase();
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        const genericTaxRegex = /^[A-Z0-9]{5,15}$/;
        return panRegex.test(cleanTax) || genericTaxRegex.test(cleanTax);
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
            errors.push('Phone number must contain exactly 10 digits (e.g. 9876543210)');
        }
        if (data.pinCode && !this.isPinCode(data.pinCode)) {
            errors.push('PIN code must contain exactly 6 digits (e.g. 380001)');
        }
        if (data.taxId && !this.isTaxId(data.taxId)) {
            errors.push('Tax ID / PAN must be a valid 10-character PAN (e.g. ABCDE1234F)');
        }

        if (errors.length > 0) {
            throw new AppError(errors.join('. '), 400, 'VALIDATION_ERROR', errors);
        }
    }
}
