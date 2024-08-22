import { AuthContextType } from "../components/auth/AuthProvider"
import { apiRequest, queryClient } from "./Common"

export interface Driver {
    driverId: string,
    driverName: string
}

export interface CreateDriverRequest {
    driverName: string
}

export interface CreateDriverResponse {
    driverId: string
}

export interface GetDriverRequest {
    driverId: string
}

export interface GetDriverResponse {
    driverId: string,
    driverName: string
}

export interface QueryDriversRequest {
}

export interface QueryDriversResponse {
    drivers: Driver[]
}

export interface DeleteDriverRequest {
    driverId: string
}

export interface DeleteDriverResponse {
}

export interface UpdateDriverRequest {
    driverId: string,
    driverName: string
}

export interface UpdateDriverResponse {
    driverId: string
}

export const createDriver = async (
    request: CreateDriverRequest,
    authContext: AuthContextType
): Promise<CreateDriverResponse> => {
    const response = await apiRequest<CreateDriverResponse>('/create_driver', request, authContext);
    await invalidateDriverCache();
    return response;
}

export const queryDrivers = async (
    request: QueryDriversRequest,
    authContext: AuthContextType
): Promise<QueryDriversResponse> => {
    return await apiRequest<QueryDriversResponse>('/query_drivers', request, authContext);
}

export const getDriver = async (
    request: GetDriverRequest,
    authContext: AuthContextType
): Promise<GetDriverResponse> => {
    return await apiRequest<GetDriverResponse>('/get_driver', request, authContext);
}

export const deleteDriver = async (
    request: DeleteDriverRequest,
    authContext: AuthContextType
): Promise<DeleteDriverResponse> => {
    const response = await apiRequest<DeleteDriverResponse>('/delete_driver', request, authContext);
    await invalidateDriverCache();
    return response;
}

export const updateDriver = async (
    request: UpdateDriverRequest,
    authContext: AuthContextType
): Promise<UpdateDriverResponse> => {
    const response = await apiRequest<UpdateDriverResponse>('/update_driver', request, authContext);
    await invalidateDriverCache();
    return response;
}

export const invalidateDriverCache = async () => {
    // Invalidates cache that has key starts with "/query_drivers or /get_drivers"
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_drivers') || key.startsWith('/get_driver');
        }
    });
}