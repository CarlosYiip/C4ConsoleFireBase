import { AuthContextType } from "../components/auth/AuthProvider";
import { apiRequest, queryClient } from './Common';

export enum AccountType {
    WeChat = "微信",
    Alipay = "支付宝",
    Bank = "银行"
}

export interface PaymentAccount {
    paymentAccountId: string;
    accountName: string;
    accountType: AccountType;
    accountNumber: string;
}

export interface CreatePaymentAccountRequest {
    accountName: string;
    accountType: AccountType;
    accountNumber: string;
}

export interface CreatePaymentAccountResponse {
    paymentAccountId: string;
}

export interface GetPaymenAccountRequest {
    paymentAccountId: string;
}

export interface GetPaymentAccountResponse {
    paymentAccount: PaymentAccount;
}

export interface UpdatePaymentAccountRequest {
    paymentAccountId: string;
    accountName?: string;
    accountType?: AccountType;
    accountNumber?: string;
}

export interface UpdatePaymentAccountResponse {
}

export interface DeletePaymentAccountRequest {
    paymentAccountId: string;
}

export interface DeletePaymentAccountResponse {
}

export interface QueryPaymentAccountsRequest {
}

export interface QueryPaymentAccountsResponse {
    paymentAccounts: PaymentAccount[];
}

export const createPaymentAccount = async (
    request: CreatePaymentAccountRequest,
    authContext: AuthContextType
): Promise<CreatePaymentAccountResponse> => {
    const response = apiRequest<CreatePaymentAccountResponse>('/create_payment_account', request, authContext);
    await invalidatePaymentAccountCache();
    return response;
}

export const getPaymentAccount = async (
    request: GetPaymenAccountRequest,
    authContext: AuthContextType
): Promise<GetPaymentAccountResponse> => {
    return apiRequest<GetPaymentAccountResponse>('/get_payment_account', request, authContext);
}

export const updatePaymentAccount = async (
    request: UpdatePaymentAccountRequest,
    authContext: AuthContextType
): Promise<UpdatePaymentAccountResponse> => {
    const response = apiRequest<UpdatePaymentAccountResponse>('/update_payment_account', request, authContext);
    await invalidatePaymentAccountCache();
    return response;
}

export const deletePaymentAccount = async (
    request: DeletePaymentAccountRequest,
    authContext: AuthContextType
): Promise<DeletePaymentAccountResponse> => {
    const response = apiRequest<DeletePaymentAccountResponse>('/delete_payment_account', request, authContext);
    await invalidatePaymentAccountCache();
    return response;
}

export const queryPaymentAccounts = async (
    request: QueryPaymentAccountsRequest,
    authContext: AuthContextType
): Promise<QueryPaymentAccountsResponse> => {
    return apiRequest<QueryPaymentAccountsResponse>('/query_payment_accounts', request, authContext);
}

export const buildDisplayNameForAccount = (account: PaymentAccount): string => {
    return `${account.accountName} (${account.accountType})`;
}

export const invalidatePaymentAccountCache = async () => {
    await queryClient.invalidateQueries({ 
        predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key.startsWith('/query_payment_accounts') || key.startsWith('/get_payment_account');
        }
    });
}