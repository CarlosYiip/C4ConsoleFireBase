import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext, AuthContextType } from '../auth/AuthProvider';
import { Exception } from '../../api/Common';

export const useApiCall = <T, R>(
    apiFunction: (request: R, authContext: AuthContextType) => Promise<T>,
) => {
    const { setNotification } = useContext(NotificationContext);
    const authContext = useContext(AuthContext)

    const callApi = async (request: R) => {
        try {
            const response = await apiFunction(request, authContext);
            return response;
        } catch (error: any) {
            error as Exception;
            if (error.statusCode === 409) {
                setNotification('存在重复的产品/客户/业务员');
            } else {
                setNotification('后台错误');
            }

            throw error;
        }
    };

  return { callApi };
};