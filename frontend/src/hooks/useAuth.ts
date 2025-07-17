import { useCallback } from 'react';
import { login as loginAction, logout as logoutAction, register as registerAction } from '../redux/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../redux/store';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, refreshToken, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        await dispatch(loginAction({ username, password })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (formData: any) => {
      try {
        await dispatch(registerAction(formData)).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  };
};
