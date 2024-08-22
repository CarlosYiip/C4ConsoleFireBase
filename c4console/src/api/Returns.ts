import { apiRequest, queryClient } from "./Common"
import { AuthContextType } from "../components/auth/AuthProvider"

export interface Return {
    returnId: string,
    customerId: string,
    salespersonId?: string,
    invoiceId?: string,
    items: ReturnItem[],
    createDatetime: string,
    overridenTotalAmount?: number
}

export interface ReturnItem {
    productId: string,
    quantity: number,
    price: number,
    warehouseName: string
}

export interface CreateReturnRequest {
    customerId: string,
    salespersonId?: string,
    invoiceId?: string,
    items: ReturnItem[]
    overridenCreateDatetime?: string
    overridenTotalAmount?: number
}

export interface CreateReturnResponse {
    returnId: string
}

export interface GetReturnRequest {
    returnId: string
}

export interface GetReturnResponse {
    returnObject: Return
}

export interface QueryReturnsRequest {
    startDatetime: string,
    endDatetime: string,
    customerId?: string,
}

export interface QueryReturnsResponse {
    returns: Return[]
}

export interface DeleteReturnRequest {
    returnId: string
}

export interface DeleteReturnResponse {
}

export const createReturn = async (request: CreateReturnRequest, authContext: AuthContextType): Promise<CreateReturnResponse> => {
    const response =  await apiRequest<CreateReturnResponse>('/create_return', request, authContext);
    // Invalidates cache that has key starts with "/query_returns, /get_return"
    invalidateReturnCache();
    return response;
}

export const getReturn = async (request: GetReturnRequest, authContext: AuthContextType): Promise<GetReturnResponse> => {
    const response =  await apiRequest<GetReturnResponse>('/get_return', request, authContext);
    return response;
}

export const queryReturns = async (request: QueryReturnsRequest, authContext: AuthContextType): Promise<QueryReturnsResponse> => {
    const response =  await apiRequest<QueryReturnsResponse>('/query_returns', request, authContext);
    return response;
}

export const deleteReturn = async (request: DeleteReturnRequest, authContext: AuthContextType): Promise<DeleteReturnResponse> => {
    const response =  await apiRequest<DeleteReturnResponse>('/delete_return', request, authContext);
    // Invalidates cache that has key starts with "/query_returns, /get_return"
    invalidateReturnCache();
    return response;
}

const invalidateReturnCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_returns') || key.startsWith('/get_return');
        }
    });
}
