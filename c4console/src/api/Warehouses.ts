import { AuthContextType } from "../components/auth/AuthProvider";
import { apiRequest, queryClient } from './Common';

export interface Warehouse {
    warehouseName: string,
    address: string
}

export interface CreateWarehouseRequest {
    warehouseName: string,
    address: string,
}

export interface CreateWarehouseResponse {
}

export interface QueryWarehousesRequest {
}

export interface QueryWarehousesResponse {
    warehouses: Warehouse[]
}

export interface DeleteWarehouseRequest {
    warehouseName: string
}

export interface DeleteWarehouseResponse {
}

export interface UpdateWarehouseRequest {
    warehouseName: string,
    address: string,
}

export interface UpdateWarehouseResponse {
}

export interface GetWarehouseRequest {
    warehouseName: string
}

export interface GetWarehouseResponse {
    warehouse: Warehouse
}

export const createWarehouse = async (request: CreateWarehouseRequest, authContext: AuthContextType): Promise<CreateWarehouseResponse> => {
    const response = await apiRequest<CreateWarehouseResponse>('/create_warehouse', request, authContext);
    await invalidateWarehouseCache();
    return response;
}

export const queryWarehouses = async (request: QueryWarehousesRequest, authContext: AuthContextType): Promise<QueryWarehousesResponse> => {
    return await apiRequest<QueryWarehousesResponse>('/query_warehouses', request, authContext);
}

export const deleteWarehouse = async (request: DeleteWarehouseRequest, authContext: AuthContextType): Promise<DeleteWarehouseResponse> => {
    const response = await apiRequest<DeleteWarehouseResponse>('/delete_warehouse', request, authContext);
    await invalidateWarehouseCache();
    return response;
}

export const updateWarehouse = async (request: UpdateWarehouseRequest, authContext: AuthContextType): Promise<UpdateWarehouseResponse> => {
    const response = await apiRequest<UpdateWarehouseResponse>('/update_warehouse', request, authContext);
    await invalidateWarehouseCache();
    return response;
}

export const getWarehouse = async (request: { warehouseName: string }, authContext: AuthContextType): Promise<{ warehouse: Warehouse }> => {
    return await apiRequest<{ warehouse: Warehouse }>('/get_warehouse', request, authContext);
}

const invalidateWarehouseCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_warehouses');
        }
    });
}