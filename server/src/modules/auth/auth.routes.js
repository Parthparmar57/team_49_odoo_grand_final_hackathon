import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    adminCreateUserSchema
} from './auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

// Password recovery routes
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Admin user management routes (ADMIN role only)
router.post('/users', authenticate, authorize(['ADMIN']), validate(adminCreateUserSchema), authController.adminCreateUser);
router.get('/users', authenticate, authorize(['ADMIN']), authController.getUsers);
router.patch('/users/:id', authenticate, authorize(['ADMIN']), authController.updateUser);

export default router;


