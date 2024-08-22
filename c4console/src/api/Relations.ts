import { AuthContextType } from '../components/auth/AuthProvider';
import { apiRequest, queryClient } from './Common';

export interface AssignCustomerToSalespersonRequest {
    customerId: string
    salespersonId: string
}

export interface AssignCustomerToSalespersonResponse {
}

export interface UnassignCustomerFromSalespersonRequest {
    customerId: string
}

export interface UnassignCustomerFromSalespersonResponse {
}

export const assignCustomerToSalesperson = async (
    request: AssignCustomerToSalespersonRequest,
    authContext: AuthContextType
): Promise<AssignCustomerToSalespersonResponse> => {
    const response = await apiRequest<AssignCustomerToSalespersonResponse>('/assign_customer_to_salesperson', request, authContext);
    await invalidateRelationCache();
    return response;
}

export const unassignCustomerFromSalesperson = async (
    request: UnassignCustomerFromSalespersonRequest,
    authContext: AuthContextType
): Promise<UnassignCustomerFromSalespersonResponse> => {
    const response = await apiRequest<UnassignCustomerFromSalespersonResponse>('/unassign_customer_from_salesperson', request, authContext);
    await invalidateRelationCache();
    return response;
}

export const invalidateRelationCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/assign_customer_to_salesperson') || 
            key.startsWith('/unassign_customer_from_salesperson');
        }
    });

    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_customers') || key.startsWith('/get_customer');
        }
    });
}