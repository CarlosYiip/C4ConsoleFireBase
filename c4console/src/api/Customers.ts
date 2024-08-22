import { AuthContextType } from "../components/auth/AuthProvider";
import { apiRequest, queryClient } from './Common';
import { invalidateRelationCache } from "./Relations";

export interface Customer {
    customerId: string,
    customerName: string,
    contactNumber: string,
    customerType: string,
    assignedSalespersonId?: string
    address?: string,
}

export enum CustomerType {
    PERSONAL = "个人",
    RESTAURANUT = "餐饮",
    SHOP = "商店",
    WHOLE_SALE = "批发",
    NIGHT_CLUB = "夜店",
    OTHER = "其他"
}

export interface CreateCustomerRequest {
    customerName: string,
    contactNumber: string,
    customerType: string,
    address: string,
}

export interface CreateCustomerResponse {
    customerId: string
}

export interface GetCustomerRequest {
    customerId: string
}

export interface GetCustomerResponse {
    customer: Customer
}

export interface QueryCustomersRequest {
    includeAssignedSalesperson?: boolean
}

export interface QueryCustomersResponse {
    customers: Customer[]
}

export interface DeleteCustomerRequest {
    customerId: string
}

export interface DeleteCustomerResponse {
}

export interface UpdateCustomerRequest {
    customerId: string,
    customerName?: string,
    contactNumber?: string,
    customerType?: string,
    address?: string,
}

export interface UpdateCustomerResponse {
}

export const createCustomer = async (
    request: CreateCustomerRequest,
    authContext: AuthContextType
): Promise<CreateCustomerResponse> => {
    const response = await apiRequest<CreateCustomerResponse>('/create_customer', request, authContext);
    await invalidateCustomerCache();
    return response;
}

export const queryCustomers = async (
    request: QueryCustomersRequest,
    authContext: AuthContextType
): Promise<QueryCustomersResponse> => {
    return await apiRequest<QueryCustomersResponse>('/query_customers', request, authContext);
}

export const deleteCustomer = async (
    request: DeleteCustomerRequest,
    authContext: AuthContextType
): Promise<DeleteCustomerResponse> => {
    const response = await apiRequest<GetCustomerResponse>('/delete_customer', request, authContext);
    await invalidateCustomerCache();
    return response;
}

export const getCustomer = async (
    request: GetCustomerRequest,
    authContext: AuthContextType
): Promise<GetCustomerResponse> => {
    return await apiRequest<GetCustomerResponse>('/get_customer', request, authContext);
}

export const updateCustomer = async (
    request: UpdateCustomerRequest,
    authContext: AuthContextType
): Promise<UpdateCustomerResponse> => {
    const response = await apiRequest<UpdateCustomerResponse>('/update_customer', request, authContext);
    await invalidateCustomerCache();
    return response;
}

export const invalidateCustomerCache = async () => {
    // Invalidates cache that has key starts with "/query_customers or /get_customer"
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_customers') || key.startsWith('/get_customer');
        }
    });
    await invalidateRelationCache();
}