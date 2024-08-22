import { AuthContextType } from '../components/auth/AuthProvider';
import { apiRequest, queryClient } from './Common';

export interface ReturnItem {
    invoiceItemId: string;
    quantity: number;
    returnWarehouseName: string;
}

export interface NewItem {
    productId: string;
    quantity: number;
    price: number;
    originalWarehouseName: string;
}

export interface ExchangeRecord {
    exchangeRecordId: string;
    createDatetime: string;
    returnItems: ReturnItem[];
    newItems: NewItem[];
}

export interface CreateExchangeRecordRequest {
    invoiceId: string;
    returnItems: ReturnItem[];
    newItems: NewItem[];
}

export interface CreateExchangeRecordResponse {
    exchangeRecordId: string;
}

export interface DeleteExchangeRecordRequest {
    exchangeRecordId: string;
}

export interface DeleteExchangeRecordResponse {
}

export interface QueryExchangeRecordsRequest {
    invoiceId: string;
}

export interface QueryExchangeRecordsResponse {
    exchangeRecords: ExchangeRecord[];
}

export interface GetExchangeRecordRequest {
    exchangeRecordId: string;
}

export interface GetExchangeRecordResponse {
    exchangeRecord: ExchangeRecord;
}

export const createExchangeRecord = async (request: CreateExchangeRecordRequest, auth: AuthContextType): Promise<CreateExchangeRecordResponse> => {
    await invalidateExchangeRecordCache();
    return await apiRequest<CreateExchangeRecordResponse>('/create_exchange_record', request, auth);
}

export const deleteExchangeRecord = async (request: DeleteExchangeRecordRequest, auth: AuthContextType): Promise<DeleteExchangeRecordResponse> => {
    await invalidateExchangeRecordCache();
    return await apiRequest<DeleteExchangeRecordResponse>('/delete_exchange_record', request, auth);
}

export const queryExchangeRecords = async (request: QueryExchangeRecordsRequest, auth: AuthContextType): Promise<QueryExchangeRecordsResponse> => {
    return await apiRequest<QueryExchangeRecordsResponse>('/query_exchange_records', request, auth);
}

export const getExchangeRecord = async (request: GetExchangeRecordRequest, auth: AuthContextType): Promise<GetExchangeRecordResponse> => {
    return await apiRequest<GetExchangeRecordResponse>('/get_exchange_record', request, auth);
}

const invalidateExchangeRecordCache = async () => {
    // Invalidate all caches
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/');
        }
    });
}
