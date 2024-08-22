import { AuthContextType } from "../components/auth/AuthProvider";
import { apiRequest, queryClient } from "./Common";

export interface CustomerPricing {
    customerId: string,
    productId: string,
    price: number
}

export interface CreateCustomerPricingRequest {
    customerId: string,
    productId: string,
    price: number
}

export interface CreateCustomerPricingResponse {
}

export interface UpdateCustomerPricingRequest {
    customerId: string,
    productId: string,
    price: number
}

export interface UpdateCustomerPricingResponse {
}

export interface DeleteCustomerPricingRequest {
    customerId: string,
    productId: string
}

export interface DeleteCustomerPricingResponse {
}

export interface QueryCustomerPricingsRequest {
    customerId: string
}

export interface QueryCustomerPricingsResponse {
    customerPricings: CustomerPricing[]
}

export const createCustomerPricing = async (
    request: CreateCustomerPricingRequest,
    authContext: AuthContextType
): Promise<CreateCustomerPricingResponse> => {
    const response = await apiRequest<CreateCustomerPricingResponse>('/create_customer_pricing', request, authContext);
    await invalidateCustomerPricingCache();
    return response;
}

export const queryCustomerPricings = async (
    request: QueryCustomerPricingsRequest,
    authContext: AuthContextType
): Promise<QueryCustomerPricingsResponse> => {
    return await apiRequest<QueryCustomerPricingsResponse>('/query_customer_pricings', request, authContext);
}

export const updateCustomerPricing = async (
    request: UpdateCustomerPricingRequest,
    authContext: AuthContextType
): Promise<UpdateCustomerPricingResponse> => {
    const response = await apiRequest<UpdateCustomerPricingResponse>('/update_customer_pricing', request, authContext);
    await invalidateCustomerPricingCache();
    return response;
}

export const deleteCustomerPricing = async (
    request: DeleteCustomerPricingRequest,
    authContext: AuthContextType
): Promise<DeleteCustomerPricingResponse> => {
    const response = await apiRequest<DeleteCustomerPricingResponse>('/delete_customer_pricing', request, authContext);
    await invalidateCustomerPricingCache();
    return response;
}

export const invalidateCustomerPricingCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_customer_pricings');
        }
    });
}
