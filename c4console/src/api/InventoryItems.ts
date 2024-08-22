import { AuthContextType } from "../components/auth/AuthProvider";
import { apiRequest, queryClient } from './Common';

export interface InventoryItem {
    warehouseName: string,
    productId: string,
    quantity: number,
    lastUpdatedDatetime?: string
}

export interface CreateInventoryItemsRequest {
    items: InventoryItem[]
    notes?: string
}

export interface CreateInventoryItemsResponse {
}

export interface UpdateInventoryItemRequest {
    warehouseName: string,
    productId: string,
    quantity: number,
}

export interface UpdateInventoryItemResponse {
}

export interface QueryInventoryRequest {
    warehouseName: string,
    filters?: {[filter: string]: string};
}

export interface QueryInventoryResponse {
    inventoryItems: InventoryItem[]
}

export interface InventoryChangeItem {
    warehouse: string,
    productId: string,
    currentQuantity?: number,
    previousQuantity?: number,
    transferedQuantity?: number,
}

export interface InventoryChangeRecord {
    recordId: string,
    type: number,
    fromWarehouse: string,
    toWarehouse: string,
    items: InventoryChangeItem[],
    createdDatetime: string
    notes?: string,
}

export interface QueryInventoryChangeRecordsRequest {
    startDatetime?: string,
    endDatetime?: string,
}

export interface QueryInventoryChangeRecordsResponse {
    records: InventoryChangeRecord[]
}

export interface DeductInventoryItemsRequest {
    items: InventoryItem[]
    notes: string
}

export interface DeductInventoryItemsResponse {
}

export interface TransferInventoryItemsRequest {
    items: InventoryItem[]
    toWarehouse: string
    notes: string
}

export interface TransferInventoryItemsResponse {
}

export const createInventoryItems = async (request: CreateInventoryItemsRequest, authContext: AuthContextType): Promise<CreateInventoryItemsResponse> => {
    const response = await apiRequest<CreateInventoryItemsResponse>('/create_inventory_items', request, authContext);
    await invalidateInventoryItemCache();
    return response;
}

export const queryInventoryItems = async (request: QueryInventoryRequest, authContext: AuthContextType): Promise<QueryInventoryResponse> => {
    return await apiRequest<QueryInventoryResponse>('/query_inventory_items', request, authContext);
}

export const updateInventoryItem = async (request: UpdateInventoryItemRequest, authContext: AuthContextType): Promise<UpdateInventoryItemResponse> => {
    const response = await apiRequest<UpdateInventoryItemResponse>('/update_inventory_item', request, authContext);
    await invalidateInventoryItemCache();
    return response;
}

export const queryInventoryChangeRecords = async (request: QueryInventoryChangeRecordsRequest, authContext: AuthContextType): Promise<QueryInventoryChangeRecordsResponse> => {
    return await apiRequest<QueryInventoryChangeRecordsResponse>('/query_inventory_change_records', request, authContext);
}

export const deductInventoryItems = async (request: DeductInventoryItemsRequest, authContext: AuthContextType): Promise<DeductInventoryItemsResponse> => {
    const response = await apiRequest<DeductInventoryItemsResponse>('/deduct_inventory_items', request, authContext);
    await invalidateInventoryItemCache();
    return response;
}

export const transferInventoryItems = async (request: TransferInventoryItemsRequest, authContext: AuthContextType): Promise<TransferInventoryItemsResponse> => {
    const response = await apiRequest<TransferInventoryItemsResponse>('/transfer_inventory_items', request, authContext);
    await invalidateInventoryItemCache();
    return response;
}

export const invalidateInventoryItemCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_inventory_items') || key.startsWith('/query_inventory_change_records');
        }
    });
}