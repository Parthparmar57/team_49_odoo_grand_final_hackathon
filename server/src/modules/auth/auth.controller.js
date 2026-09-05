import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const register = async (req, res, next) => {
    try {
        const result = await AuthService.register(req.body);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return ApiResponse.success(res, result.user, 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await AuthService.login(req.body);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return ApiResponse.success(res, result.user, 200);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res) => {
    res.clearCookie('token');
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
