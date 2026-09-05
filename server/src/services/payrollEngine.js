import { CalculationMethod, RuleCategory } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

export class PayrollEngine {
    static computePayslipForContract(contract, periodStart, periodEnd) {
        const baseWage = Number(contract.wage);
        const rules = contract.salaryStructure?.rules || [];

        if (rules.length === 0) {
            throw new AppError(`Salary structure #${contract.salaryStructureId} has no active rules`, 400, 'NO_SALARY_RULES');
        }

        const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);
        const valueMap = new Map();
        const lineResults = [];

        let totalBasic = 0;
        let totalGross = 0;
        let totalDeductions = 0;

        for (const rule of sortedRules) {
            let calculatedAmount = 0;

            if (rule.computationMethod === CalculationMethod.FIXED) {
                calculatedAmount = Number(rule.amount || 0);
            } else if (rule.computationMethod === CalculationMethod.PERCENTAGE) {
                let baseAmount = baseWage;
                if (rule.percentageBasedOn && valueMap.has(rule.percentageBasedOn)) {
                    baseAmount = valueMap.get(rule.percentageBasedOn) || 0;
                }
                const pct = Number(rule.percentage || 0);
                calculatedAmount = (baseAmount * pct) / 100;
            } else if (rule.computationMethod === CalculationMethod.FORMULA) {
                calculatedAmount = this.evaluateFormula(rule.formula || '0', valueMap);
            }

            calculatedAmount = Math.round(calculatedAmount * 100) / 100;
            valueMap.set(rule.code, calculatedAmount);

            if (rule.category === RuleCategory.BASIC) totalBasic += calculatedAmount;
            if (rule.category === RuleCategory.GROSS) totalGross = calculatedAmount;
            if (rule.category === RuleCategory.DEDUCTION) totalDeductions += calculatedAmount;

            lineResults.push({
                ruleId: rule.id,
                code: rule.code,
                name: rule.name,
                category: rule.category,
                amount: calculatedAmount,
                rate: rule.percentage ? Number(rule.percentage) : undefined,
            });
        }

        const netSalary = valueMap.has('NET') ? valueMap.get('NET') : totalGross - totalDeductions;

        return {
            contractId: contract.id,
            employeeId: contract.employeeId,
            basicSalary: totalBasic || baseWage * 0.4,
            grossSalary: totalGross || baseWage,
            totalDeductions,
            netSalary: Math.max(0, netSalary),
            lines: lineResults,
        };
    }

    static evaluateFormula(formula, valueMap) {
        try {
            let expr = formula;
            for (const [code, val] of valueMap.entries()) {
                const regex = new RegExp(`\\b${code}\\b`, 'g');
                expr = expr.replace(regex, val.toString());
            }
            expr = expr.replace(/[A-Z_]+/g, '0');
            const result = Function(`"use strict"; return (${expr})`)();
            return isNaN(result) ? 0 : result;
        } catch (err) {
            console.warn(`Failed to evaluate formula '${formula}':`, err);
            return 0;
        }
    }

    static validatePreRunWarnings(employee, contract) {
        const warnings = [];

        if (!employee.bankName || !employee.accountNumber) {
            warnings.push(`Employee ${employee.firstName} ${employee.lastName} missing bank account details.`);
        }

        if (!contract || contract.wage <= 0) {
            warnings.push(`Employee ${employee.firstName} ${employee.lastName} has no valid contract wage.`);
        }

        return warnings;
    }
}
