import { AuthContextType } from "../components/auth/AuthProvider"
import { apiRequest, queryClient } from './Common';
import { invalidateRelationCache } from "./Relations";

export interface Salesperson {
    salespersonId: string,
    salespersonName: string
    contactNumber: string
}

export interface CreateSalespersonRequest {
    salespersonName: string,
    contactNumber: string,
}

export interface CreateSalespersonResponse {
    salespersonId: string
}

export interface DeleteSalespersonRequest {
    salespersonId: string
}

export interface DeleteSalespersonResponse {
}

export interface QuerySalespersonsRequest {
}

export interface QuerySalespersonsResponse {
    salespersons: Salesperson[]
}

export interface GetSalespersonRequest {
    salespersonId: string
}

export interface GetSalespersonResponse {
    salesperson: Salesperson
}

export interface UpdateSalespersonRequest {
    salespersonId: string,
    salespersonName: string,
    contactNumber: string,
}

export interface UpdateSalespersonResponse {
}

export const createSalesperson = async (
    request: CreateSalespersonRequest,
    authContext: AuthContextType
): Promise<CreateSalespersonResponse> => {
    const response = await apiRequest<CreateSalespersonResponse>('/create_salesperson', request, authContext);
    await invalidatesSalespersonCache();
    return response;
}

export const querySalespersons = async (
    request: QuerySalespersonsRequest,
    authContext: AuthContextType
): Promise<QuerySalespersonsResponse> => {
    return await apiRequest<QuerySalespersonsResponse>('/query_salespersons', request, authContext);
}

export const deleteSalesperson = async (
    request: DeleteSalespersonRequest,
    authContext: AuthContextType
): Promise<DeleteSalespersonResponse> => {
    const response = await apiRequest<DeleteSalespersonResponse>('/delete_salesperson', request, authContext);
    await invalidatesSalespersonCache();
    return response;
}

export const updateSalesperson = async (
    request: UpdateSalespersonRequest,
    authContext: AuthContextType
): Promise<UpdateSalespersonResponse> => {
    const response = await apiRequest<UpdateSalespersonResponse>('/update_salesperson', request, authContext);
    await invalidatesSalespersonCache();
    return response;
}

export const getSalesperson = async (
    request: GetSalespersonRequest,
    authContext: AuthContextType
): Promise<GetSalespersonResponse> => {
    return await apiRequest<GetSalespersonResponse>('/get_salesperson', request, authContext);
}

export const invalidatesSalespersonCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_salespersons');
        }
    });

    await invalidateRelationCache();
}