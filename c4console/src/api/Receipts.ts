import { AuthContextType } from "../components/auth/AuthProvider";
import { apiRequest, queryClient } from './Common';

export interface ReceiptSummary {
    receiptId: string,
    invoiceId: string,
    paymentAccountId: string,
    totalAmount: number,
    deductAmount?: number,
    createDatetime: string,
    salespersonId: string,
    customerId: string
}

export interface ReceiptItems {
    receiptId: string
    productId: string,
}

export interface CreateReceiptRequest {
    invoiceId: string,
    receiptItems: ReceiptItems[],
    totalAmount: number,
    deductAmount?: number,
    paymentAccountId: string,
    overridenCreateDatetime?: string
}

export interface CreateReceiptResponse {
    receiptId: string
}

export interface QueryReceiptsRequest {
    startDatetime?: string,
    endDatetime?: string,
    limit?: number,
}

export interface QueryReceiptsResponse {
    receiptSummaries: ReceiptSummary[]
}

export interface DeleteReceiptRequest {
    receiptId: string
}

export interface DeleteReceiptResponse {
}

export interface QueryReceiptsByInvoiceIdRequest {
    invoiceId: string
}

export interface QueryReceiptsByInvoiceIdResponse {
    receiptSummaries: ReceiptSummary[]
}

export interface BatchCreateReceiptsRequest {
    invoiceIds: string[],
    paymentAccountId: string,
}

export interface BatchCreateReceiptsResponse {
    receiptIds: string[]
}

export const createReceipt = async (request: CreateReceiptRequest, authContext: AuthContextType): Promise<CreateReceiptResponse> => {
    const response = await apiRequest<CreateReceiptResponse>('/create_receipt', request, authContext);
    await invalidateReceiptCache();
    return response;
}

export const deleteReceipt = async (request: DeleteReceiptRequest, authContext: AuthContextType): Promise<DeleteReceiptResponse> => {
    const response = await apiRequest<DeleteReceiptResponse>('/delete_receipt', request, authContext);
    await invalidateReceiptCache();
    return response;
}

export const queryReceipts = async (request: QueryReceiptsRequest, authContext: AuthContextType): Promise<QueryReceiptsResponse> => {
    return await apiRequest<QueryReceiptsResponse>('/query_receipts', request, authContext);
}

export const queryReceiptsByInvoiceId = async (request: QueryReceiptsByInvoiceIdRequest, authContext: AuthContextType): Promise<QueryReceiptsByInvoiceIdResponse> => {
    return await apiRequest<QueryReceiptsByInvoiceIdResponse>('/query_receipts_by_invoice_id', request, authContext);
}

export const batchCreateReceipts = async (request: BatchCreateReceiptsRequest, authContext: AuthContextType): Promise<BatchCreateReceiptsResponse> => {
    const response = await apiRequest<BatchCreateReceiptsResponse>('/batch_create_receipts', request, authContext);
    await invalidateReceiptCache();
    return response;
}

export const invalidateReceiptCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_receipts_by_invoice_id') || key.startsWith('/query_receipts');
        }
    });

    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_invoice_summaries') || key.startsWith('/get_invoice');
        }
    });
}
