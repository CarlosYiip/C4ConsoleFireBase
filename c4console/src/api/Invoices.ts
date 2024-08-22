import { AuthContextType } from '../components/auth/AuthProvider';
import { apiRequest, queryClient } from './Common';
import { invalidateInventoryItemCache } from './InventoryItems';
import { invalidateReceiptCache } from './Receipts';

// This is only related to CreateInvoiceRequest
export interface Invoice {
    id?: string,
    items: InvoiceItem[],
    customerId: string,
    salespersonId: string,
    driverId?: string,
    shippingClerkName?: string,
    billingClerkName?: string,
    warehouseName: string,
    overridenTotalAmount?: number,
    overridenCreateDatetime?: string
    dueDate: string,
    notes?: string,
    settlementType?: number // 0 for cash, 1 for monthly settlement
}

export interface InvoiceSummary {
    invoiceId: string,
    customerId: string,
    salespersonId: string,
    driverId?: string,
    shippingClerkName?: string,
    billingClerkName?: string,
    totalAmount: number,
    overridenTotalAmount?: number,
    warehouseName: string,
    createDatetime: string,
    dueDate: string,
    paidAmount: number
    notes?: string
    settlementType?: number
}

// TODO - Fix the type of InvoiceItem
export interface InvoiceItem {
    invoiceItemId?: string,
    productId: string,
    quantity: number,
    amount?: number
    displayName?: string,
    requestQuantity?: number
    price: number,
    warehouseName?: string
    notes?: string
}

export interface CreateInvoiceRequest {
    invoice: Invoice
}

export interface CreateInvoiceResponse {
    invoiceId: string
}

export interface QueryInvoiceSummariesRequest {
    filters?: {[filter: string]: string};
    startDatetime?: string,
    endDatetime?: string,
    customerId?: string,
    salespersonId?: string,
    settlementType?: number,
    excludeFullyPaid?: boolean,
    limit?: number,
    lastEvaluatedKey?: string
}

export interface QueryInvoiceSummariesResponse {
    invoiceSummaries: InvoiceSummary[],
    lastEvaluatedKey?: string
}

export interface QueryInvoiceItemsRequest {
    startDatetime?: string,
    endDatetime?: string,
    customerId?: string,
    salespersonId?: string
}

export interface QueryInvoiceItemsResponse {
    invoiceItems: InvoiceItem[]
}

export interface DeleteInvoiceRequest {
    invoiceId: string
}

export interface DeleteInvoiceResponse {
}

export interface GetInvoiceRequest {
    invoiceId: string,
    includeInvoiceItems?: boolean
}

export interface GetInvoiceResponse {
    invoiceSummary: InvoiceSummary
    invoiceItems: InvoiceItem[]
}

export interface UpdateInvoiceSummaryRequest {
    invoiceId: string
    dueDate?: string
}

export interface UpdateInvoiceSummaryResponse {
}

export interface UpdateInvoiceItemRequest {
    invoiceItemId: string,
    quantity?: number,
    price?: number
}

export interface UpdateInvoiceItemResponse {
}

export interface DeleteInvoiceItemRequest {
    invoiceItemId: string
}

export interface DeleteInvoiceItemResponse {
}

export enum DueDateOption {
    NOW = 'now',
    END_OF_MONTH = 'endOfMonth',
    CUSTOM = 'custom'
}

export enum SettlementType {
    CASH_ON_DELIVERY = 0,
    MONTHLY = 1,
}

export const createInvoice = async (request: CreateInvoiceRequest, authContext: AuthContextType): Promise<CreateInvoiceResponse> => {
    const response =  await apiRequest<CreateInvoiceResponse>('/create_invoice', request.invoice, authContext);

    // Invalidates cache that has key starts with "/query_invoice_summaries, /get_invoice or /query_invoice_items"
    await invalidateInvoiceCache();

    return response;
}

export const getInvoice = async (request: GetInvoiceRequest, authContext: AuthContextType): Promise<GetInvoiceResponse> => {
    return await apiRequest<GetInvoiceResponse>('/get_invoice', request, authContext);
}

export const queryInvoiceSummaries = async (
    request: QueryInvoiceSummariesRequest,
    authContext: AuthContextType
): Promise<QueryInvoiceSummariesResponse> => {
    return await apiRequest<QueryInvoiceSummariesResponse>('/query_invoice_summaries', request, authContext);
}

export const deleteInvoice = async (request: DeleteInvoiceRequest, authContext: AuthContextType): Promise<DeleteInvoiceResponse> => {
    const response = await apiRequest<DeleteInvoiceResponse>('/delete_invoice', request, authContext);

    // Invalidates cache that has key starts with "/query_invoice_summaries, /get_invoice or /query_invoice_items"
    await invalidateInvoiceCache();
    
    return response
}

export const queryInvoiceItems = async (request: QueryInvoiceItemsRequest, authContext: AuthContextType): Promise<QueryInvoiceItemsResponse> => {
    return await apiRequest<QueryInvoiceItemsResponse>('/query_invoice_items', request, authContext);
}

export const updateInvoiceSummary = async (request: UpdateInvoiceSummaryRequest, authContext: AuthContextType): Promise<UpdateInvoiceSummaryResponse> => {
    const response = await apiRequest<UpdateInvoiceSummaryResponse>('/update_invoice_summary', request, authContext);

    // Invalidates cache that has key starts with "/query_invoice_summaries, /get_invoice or /query_invoice_items"
    await invalidateInvoiceCache();

    return response;
}

export const updateInvoiceItem = async (request: UpdateInvoiceItemRequest, authContext: AuthContextType): Promise<UpdateInvoiceItemResponse> => {
    const response = await apiRequest<UpdateInvoiceItemResponse>('/update_invoice_item', request, authContext);

    // Invalidates cache that has key starts with "/query_invoice_summaries, /get_invoice or /query_invoice_items"
    await invalidateInvoiceCache();

    return response;
}

export const deleteInvoiceItem = async (request: DeleteInvoiceItemRequest, authContext: AuthContextType): Promise<DeleteInvoiceItemResponse> => {
    const response = await apiRequest<DeleteInvoiceItemRequest>('/delete_invoice_item', request, authContext);

    // Invalidates cache that has key starts with "/query_invoice_summaries, /get_invoice or /query_invoice_items"
    await invalidateInvoiceCache();

    return response;
}

const invalidateInvoiceCache = async () => {
    console.log("Invalidating invoice api cache")
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_invoice_summaries') || key.startsWith('/get_invoice') || key.startsWith('/query_invoice_items');
        }
    });
    await invalidateReceiptCache();
    await invalidateInventoryItemCache();
}