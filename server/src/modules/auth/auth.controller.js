import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const register = async (req, res, next) => {
    try {
        const result = await AuthService.register(req.body);
        res.cookie('token', result.token, getCookieOptions());
        return ApiResponse.success(res, { user: result.user, token: result.token }, 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await AuthService.login(req.body);
        res.cookie('token', result.token, getCookieOptions());
        return ApiResponse.success(res, { user: result.user, token: result.token }, 200);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res) => {
    const { maxAge: _, ...clearOptions } = getCookieOptions();
    res.clearCookie('token', clearOptions);
    return ApiResponse.success(res, { message: 'Logged out successfully' });
};

export const getMe = async (req, res, next) => {
    try {
        const profile = await AuthService.getUserProfile(req.user.id);
        return ApiResponse.success(res, profile);
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const result = await AuthService.forgotPassword(req.body);
        return ApiResponse.success(res, result, 200);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const result = await AuthService.resetPassword(req.body);
        return ApiResponse.success(res, result, 200);
    } catch (error) {
        next(error);
    }
};

export const adminCreateUser = async (req, res, next) => {
    try {
        const result = await AuthService.adminCreateUser(req.body);
        return ApiResponse.success(res, result, 201);
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const result = await AuthService.getUsers(req.query);
        return ApiResponse.success(res, result.users, 200, result.pagination);
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const result = await AuthService.updateUser(req.params.id, req.body);
        return ApiResponse.success(res, result, 200);
    } catch (error) {
        next(error);
    }
};


