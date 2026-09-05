import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { FormulaEvaluator } from './formulaEvaluator.js';

export class StructuresService {
  /**
   * Get all salary structures with rule counts and sorted rules
   */
  static async getSalaryStructures() {
    return prisma.salaryStructure.findMany({
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: { rules: true, contracts: true, payruns: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single salary structure by ID
   */
  static async getSalaryStructureById(id) {
    const structure = await prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: { rules: true, contracts: true, payruns: true },
        },
      },
    });

    if (!structure) {
      throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
    }

    return structure;
  }

  /**
   * Create a new salary structure
   */
  static async createSalaryStructure(data) {
    const existing = await prisma.salaryStructure.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existing) {
      throw new AppError(
        'Salary structure with this name or code already exists',
        400,
        'STRUCTURE_EXISTS'
      );
    }

    return prisma.salaryStructure.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        active: data.active !== undefined ? data.active : true,
        rules: data.rules ? { create: data.rules } : undefined,
      },
      include: {
        rules: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  /**
   * Update an existing salary structure
   */
  static async updateSalaryStructure(id, data) {
    await this.getSalaryStructureById(id);

    if (data.code) {
      const existing = await prisma.salaryStructure.findFirst({
        where: {
          code: data.code.toUpperCase(),
          NOT: { id },
        },
      });
      if (existing) {
        throw new AppError('Salary structure with this code already exists', 400, 'CODE_EXISTS');
      }
    }

    return prisma.salaryStructure.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.active !== undefined && { active: data.active }),
      },
      include: {
        rules: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  /**
   * Delete a salary structure
   */
  static async deleteSalaryStructure(id) {
    const structure = await this.getSalaryStructureById(id);

    if (structure._count.contracts > 0 || structure._count.payruns > 0) {
      throw new AppError(
        'Cannot delete salary structure attached to existing contracts or payruns',
        400,
        'STRUCTURE_IN_USE'
      );
    }

    await prisma.salaryStructure.delete({ where: { id } });
    return { message: 'Salary structure deleted successfully' };
  }

  /**
   * Add a salary rule to a structure
   */
  static async addSalaryRule(structureId, data) {
    await this.getSalaryStructureById(structureId);

    // Check code uniqueness within structure
    const existingRule = await prisma.salaryRule.findFirst({
      where: {
        salaryStructureId: structureId,
        code: data.code.toUpperCase(),
      },
    });

    if (existingRule) {
      throw new AppError(
        `Rule with code '${data.code}' already exists in this structure`,
        400,
        'RULE_CODE_EXISTS'
      );
    }

    // Validate formula if method is FORMULA
    if (data.computationMethod === 'FORMULA' && data.formula) {
      FormulaEvaluator.validateFormula(data.formula);
    }

    return prisma.salaryRule.create({
      data: {
        salaryStructureId: structureId,
        name: data.name,
        code: data.code.toUpperCase(),
        category: data.category,
        sequence: parseInt(data.sequence) || 10,
        computationMethod: data.computationMethod || 'FIXED',
        amount: data.amount !== undefined ? parseFloat(data.amount) : null,
        percentage: data.percentage !== undefined ? parseFloat(data.percentage) : null,
        percentageBasedOn: data.percentageBasedOn || null,
        formula: data.formula || null,
        active: data.active !== undefined ? data.active : true,
      },
    });
  }

  /**
   * Update an existing salary rule
   */
  static async updateSalaryRule(structureId, ruleId, data) {
    const rule = await prisma.salaryRule.findFirst({
      where: { id: ruleId, salaryStructureId: structureId },
    });

    if (!rule) {
      throw new AppError('Salary rule not found in this structure', 404, 'RULE_NOT_FOUND');
    }

    if (data.code && data.code.toUpperCase() !== rule.code) {
      const existing = await prisma.salaryRule.findFirst({
        where: {
          salaryStructureId: structureId,
          code: data.code.toUpperCase(),
          NOT: { id: ruleId },
        },
      });
      if (existing) {
        throw new AppError(
          `Rule code '${data.code}' already exists in this structure`,
          400,
          'RULE_CODE_EXISTS'
        );
      }
    }

    if (data.computationMethod === 'FORMULA' && data.formula) {
      FormulaEvaluator.validateFormula(data.formula);
    }

    return prisma.salaryRule.update({
      where: { id: ruleId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.category && { category: data.category }),
        ...(data.sequence !== undefined && { sequence: parseInt(data.sequence) }),
        ...(data.computationMethod && { computationMethod: data.computationMethod }),
        ...(data.amount !== undefined && { amount: data.amount ? parseFloat(data.amount) : null }),
        ...(data.percentage !== undefined && { percentage: data.percentage ? parseFloat(data.percentage) : null }),
        ...(data.percentageBasedOn !== undefined && { percentageBasedOn: data.percentageBasedOn }),
        ...(data.formula !== undefined && { formula: data.formula }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  }

  /**
   * Delete a salary rule
   */
  static async deleteSalaryRule(structureId, ruleId) {
    const rule = await prisma.salaryRule.findFirst({
      where: { id: ruleId, salaryStructureId: structureId },
    });

    if (!rule) {
      throw new AppError('Salary rule not found in this structure', 404, 'RULE_NOT_FOUND');
    }

    await prisma.salaryRule.delete({ where: { id: ruleId } });
    return { message: 'Salary rule deleted successfully' };
  }
}

// Controller Handler Wrappers for Express Routing
export const getStructures = async (req, res, next) => {
  try {
    const structures = await StructuresService.getSalaryStructures();
    return res.json({ success: true, data: structures });
  } catch (error) {
    next(error);
  }
};

export const getStructureById = async (req, res, next) => {
  try {
    const structure = await StructuresService.getSalaryStructureById(req.params.id);
    return res.json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
};

export const createStructure = async (req, res, next) => {
  try {
    const structure = await StructuresService.createSalaryStructure(req.body);
    return res.status(201).json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
};

export const updateStructure = async (req, res, next) => {
  try {
    const structure = await StructuresService.updateSalaryStructure(req.params.id, req.body);
    return res.json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
};

export const deleteStructure = async (req, res, next) => {
  try {
    const result = await StructuresService.deleteSalaryStructure(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addRule = async (req, res, next) => {
  try {
    const rule = await StructuresService.addSalaryRule(req.params.id, req.body);
    return res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (req, res, next) => {
  try {
    const rule = await StructuresService.updateSalaryRule(req.params.id, req.params.ruleId, req.body);
    return res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const deleteRule = async (req, res, next) => {
  try {
    const result = await StructuresService.deleteSalaryRule(req.params.id, req.params.ruleId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
