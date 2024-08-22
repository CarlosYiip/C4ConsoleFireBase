import React, { createContext, ReactNode } from 'react';
import { AuthContextType } from '../components/auth/AuthProvider';
import { createSalesperson, CreateSalespersonRequest, CreateSalespersonResponse, deleteSalesperson, DeleteSalespersonRequest, DeleteSalespersonResponse, querySalespersons, QuerySalespersonsRequest, QuerySalespersonsResponse, updateSalesperson, UpdateSalespersonRequest, UpdateSalespersonResponse, getSalesperson, GetSalespersonResponse, GetSalespersonRequest } from './Salespersons';
import { createCustomer, CreateCustomerRequest, CreateCustomerResponse, deleteCustomer, DeleteCustomerRequest, DeleteCustomerResponse, getCustomer, GetCustomerRequest, GetCustomerResponse, queryCustomers, QueryCustomersRequest, QueryCustomersResponse, updateCustomer, UpdateCustomerRequest, UpdateCustomerResponse } from './Customers';
import { AssignCustomerToSalespersonRequest, AssignCustomerToSalespersonResponse, UnassignCustomerFromSalespersonRequest, UnassignCustomerFromSalespersonResponse, assignCustomerToSalesperson, unassignCustomerFromSalesperson } from './Relations';
import { createInvoice, CreateInvoiceRequest, CreateInvoiceResponse, deleteInvoice, DeleteInvoiceRequest, DeleteInvoiceResponse, queryInvoiceItems, QueryInvoiceItemsRequest, QueryInvoiceItemsResponse, queryInvoiceSummaries, QueryInvoiceSummariesRequest, QueryInvoiceSummariesResponse, getInvoice, GetInvoiceRequest, GetInvoiceResponse, updateInvoiceSummary, UpdateInvoiceSummaryRequest, UpdateInvoiceSummaryResponse, deleteInvoiceItem, updateInvoiceItem, UpdateInvoiceItemRequest, DeleteInvoiceItemRequest, DeleteInvoiceItemResponse } from './Invoices';
import { createReceipt, CreateReceiptRequest, CreateReceiptResponse, deleteReceipt, DeleteReceiptRequest, DeleteReceiptResponse, queryReceiptsByInvoiceId, QueryReceiptsByInvoiceIdRequest, QueryReceiptsByInvoiceIdResponse, queryReceipts, QueryReceiptsRequest, QueryReceiptsResponse, BatchCreateReceiptsRequest, BatchCreateReceiptsResponse, batchCreateReceipts } from './Receipts';
import { createProduct, CreateProductRequest, CreateProductResponse, deleteProduct, DeleteProductRequest, DeleteProductResponse, getProduct, GetProductRequest, GetProductResponse, queryProducts, QueryProductsRequest, QueryProductsResponse, updateProduct, UpdateProductRequest, UpdateProductResponse } from './Products';
import { createWarehouse, CreateWarehouseRequest, CreateWarehouseResponse, deleteWarehouse, DeleteWarehouseRequest, DeleteWarehouseResponse, queryWarehouses, QueryWarehousesRequest, QueryWarehousesResponse, updateWarehouse, UpdateWarehouseRequest, UpdateWarehouseResponse, getWarehouse, GetWarehouseResponse, GetWarehouseRequest } from './Warehouses';
import { createInventoryItems, CreateInventoryItemsRequest, CreateInventoryItemsResponse, queryInventoryItems, QueryInventoryRequest, QueryInventoryResponse, updateInventoryItem, UpdateInventoryItemRequest, UpdateInventoryItemResponse, QueryInventoryChangeRecordsRequest, QueryInventoryChangeRecordsResponse, queryInventoryChangeRecords, DeductInventoryItemsRequest, DeductInventoryItemsResponse, deductInventoryItems, TransferInventoryItemsResponse, TransferInventoryItemsRequest, transferInventoryItems } from './InventoryItems';
import { sendMessage, SendMessageRequest, SendMessageResponse } from './Messages';
import { createPaymentAccount, CreatePaymentAccountRequest, CreatePaymentAccountResponse, deletePaymentAccount, DeletePaymentAccountRequest, DeletePaymentAccountResponse, GetPaymenAccountRequest, getPaymentAccount, GetPaymentAccountResponse, queryPaymentAccounts, QueryPaymentAccountsRequest, QueryPaymentAccountsResponse, updatePaymentAccount, UpdatePaymentAccountRequest, UpdatePaymentAccountResponse } from './PaymentAccounts';
import { createExchangeRecord, CreateExchangeRecordRequest, CreateExchangeRecordResponse, deleteExchangeRecord, DeleteExchangeRecordRequest, DeleteExchangeRecordResponse, getExchangeRecord, GetExchangeRecordRequest, GetExchangeRecordResponse, queryExchangeRecords, QueryExchangeRecordsRequest, QueryExchangeRecordsResponse } from './Exchange';
import { createDriver, CreateDriverRequest, CreateDriverResponse, deleteDriver, DeleteDriverRequest, DeleteDriverResponse, getDriver, GetDriverRequest, GetDriverResponse, queryDrivers, QueryDriversRequest, QueryDriversResponse, updateDriver, UpdateDriverRequest, UpdateDriverResponse } from './Drivers';
import { createReturn, CreateReturnRequest, CreateReturnResponse, deleteReturn, DeleteReturnRequest, DeleteReturnResponse, getReturn, GetReturnRequest, GetReturnResponse, queryReturns, QueryReturnsRequest, QueryReturnsResponse } from './Returns';
import { createCustomerPricing, CreateCustomerPricingRequest, CreateCustomerPricingResponse, deleteCustomerPricing, DeleteCustomerPricingRequest, DeleteCustomerPricingResponse, queryCustomerPricings, QueryCustomerPricingsRequest, QueryCustomerPricingsResponse, updateCustomerPricing, UpdateCustomerPricingRequest, UpdateCustomerPricingResponse } from './CustomerPricings';

export const endpoint = !process.env.REACT_APP_API_ID || !process.env.REACT_APP_REGION ? "http://127.0.0.1:5000/" : `https://${process.env.REACT_APP_API_ID}.execute-api.${process.env.REACT_APP_REGION}.amazonaws.com/prod/`

// Define the API context
interface BackendApiContextProps {
    // Define your API methods here
    // Invoice APIs
    createInvoice: (request: CreateInvoiceRequest, authContext: AuthContextType) => Promise<CreateInvoiceResponse>;
    queryInvoiceSummaries: (request: QueryInvoiceSummariesRequest, authContext: AuthContextType) => Promise<QueryInvoiceSummariesResponse>;
    queryInvoiceItems: (request: QueryInvoiceItemsRequest, authContext: AuthContextType) => Promise<QueryInvoiceItemsResponse>;
    deleteInvoice: (request: DeleteInvoiceRequest, authContext: AuthContextType) => Promise<DeleteInvoiceResponse>;
    getInvoice: (request: GetInvoiceRequest, authContext: AuthContextType) => Promise<GetInvoiceResponse>;
    updateInvoiceSummary: (request: UpdateInvoiceSummaryRequest, authContext: AuthContextType) => Promise<UpdateInvoiceSummaryResponse>;
    updateInvoiceItem: (request: UpdateInvoiceItemRequest, authContext: AuthContextType) => Promise<UpdateInventoryItemResponse>;
    deleteInvoiceItem: (request: DeleteInvoiceItemRequest, authContext: AuthContextType) => Promise<DeleteInvoiceItemResponse>;

    // Receipt APIs
    createReceipt: (request: CreateReceiptRequest, authContext: AuthContextType) => Promise<CreateReceiptResponse>;
    queryReceipts: (request: QueryReceiptsRequest, authContext: AuthContextType) => Promise<QueryReceiptsResponse>;
    getReceiptsByInvoiceId: (request: QueryReceiptsByInvoiceIdRequest, authContext: AuthContextType) => Promise<QueryReceiptsByInvoiceIdResponse>;
    deleteReceipt: (request: DeleteReceiptRequest, authContext: AuthContextType) => Promise<DeleteReceiptResponse>;
    batchCreateReceipts: (request: BatchCreateReceiptsRequest, authContext: AuthContextType) => Promise<BatchCreateReceiptsResponse>;

    // Customer APIs
    createCustomer: (request: CreateCustomerRequest, authContext: AuthContextType) => Promise<CreateCustomerResponse>;
    getCustomer: (request: GetCustomerRequest, authContext: AuthContextType) => Promise<GetCustomerResponse>;
    queryCustomers: (request: QueryCustomersRequest, authContext: AuthContextType) => Promise<QueryCustomersResponse>;
    deleteCustomer: (request: DeleteCustomerRequest, authContext: AuthContextType) => Promise<DeleteCustomerResponse>;
    updateCustomer(request: UpdateCustomerRequest, authContext: AuthContextType): Promise<UpdateCustomerResponse>;

    // Salesperson APIs
    createSalesperson: (request: CreateSalespersonRequest, authContext: AuthContextType) => Promise<CreateSalespersonResponse>;
    querySalespersons: (request: QuerySalespersonsRequest, authContext: AuthContextType) => Promise<QuerySalespersonsResponse>;
    deleteSalesperson: (request: DeleteSalespersonRequest, authContext: AuthContextType) => Promise<DeleteSalespersonResponse>;
    updateSalesperson: (request: UpdateSalespersonRequest, authContext: AuthContextType) => Promise<UpdateSalespersonResponse>;
    getSalesperson: (request: GetSalespersonRequest, authContext: AuthContextType) => Promise<GetSalespersonResponse>;

    // Warehouse APIs
    createWarehouse: (request: CreateWarehouseRequest, authContext: AuthContextType) => Promise<CreateWarehouseResponse>;
    queryWarehouses: (request: QueryWarehousesRequest, authContext: AuthContextType) => Promise<QueryWarehousesResponse>;
    deleteWarehouse: (request: DeleteWarehouseRequest, authContext: AuthContextType) => Promise<DeleteWarehouseResponse>;
    updateWarehouse: (request: UpdateWarehouseRequest, authContext: AuthContextType) => Promise<UpdateWarehouseResponse>;
    getWarehouse: (request: GetWarehouseRequest, authContext: AuthContextType) => Promise<GetWarehouseResponse>;
    
    // Inventory APIs
    queryInventoryItems: (request: QueryInventoryRequest, authContext: AuthContextType) => Promise<QueryInventoryResponse>;
    createInventoryItems: (request: CreateInventoryItemsRequest, authContext: AuthContextType) => Promise<CreateInventoryItemsResponse>;
    updateInventoryItem: (request: UpdateInventoryItemRequest, authContext: AuthContextType) => Promise<UpdateInventoryItemResponse>;
    queryInventoryChangeRecords: (request: QueryInventoryChangeRecordsRequest, authContext: AuthContextType) => Promise<QueryInventoryChangeRecordsResponse>;
    deductInventoryItems: (request: DeductInventoryItemsRequest, authContext: AuthContextType) => Promise<DeductInventoryItemsResponse>;
    transferInventoryItems: (request: TransferInventoryItemsRequest, authContext: AuthContextType) => Promise<TransferInventoryItemsResponse>;
    
    // Product APIs
    createProduct: (request: CreateProductRequest, authContext: AuthContextType) => Promise<CreateProductResponse>;
    queryProducts: (request: QueryProductsRequest, authContext: AuthContextType) => Promise<QueryProductsResponse>;
    deleteProduct: (request: DeleteProductRequest, authContext: AuthContextType) => Promise<DeleteProductResponse>;
    getProduct: (request: GetProductRequest, authContext: AuthContextType) => Promise<GetProductResponse>;
    updateProduct: (request: UpdateProductRequest, authContext: AuthContextType) => Promise<UpdateProductResponse>;

    // Relation APIs
    assignCustomerToSalesperson: (request: AssignCustomerToSalespersonRequest, authContext: AuthContextType) => Promise<AssignCustomerToSalespersonResponse>;
    unassignCustomerFromSalesperson: (request: UnassignCustomerFromSalespersonRequest, authContext: AuthContextType) => Promise<UnassignCustomerFromSalespersonResponse>;

    // Message APIs
    sendMessage: (request: SendMessageRequest, authContext: AuthContextType) => Promise<SendMessageResponse>;

    // Payment Account APIs
    createPaymentAccount: (request: CreatePaymentAccountRequest, authContext: AuthContextType) => Promise<CreatePaymentAccountResponse>;
    queryPaymentAccounts: (request: QueryPaymentAccountsRequest, authContext: AuthContextType) => Promise<QueryPaymentAccountsResponse>;
    updatePaymentAccount: (request: UpdatePaymentAccountRequest, authContext: AuthContextType) => Promise<UpdatePaymentAccountResponse>;
    deletePaymentAccount: (request: DeletePaymentAccountRequest, authContext: AuthContextType) => Promise<DeletePaymentAccountResponse>;
    getPaymentAccount: (request: GetPaymenAccountRequest, authContext: AuthContextType) => Promise<GetPaymentAccountResponse>;

    // Exchange Record APIs
    createExchangeRecord: (request: CreateExchangeRecordRequest, authContext: AuthContextType) => Promise<CreateExchangeRecordResponse>;
    deleteExchangeRecord: (request: DeleteExchangeRecordRequest, authContext: AuthContextType) => Promise<DeleteExchangeRecordResponse>;
    queryExchangeRecords: (request: QueryExchangeRecordsRequest, authContext: AuthContextType) => Promise<QueryExchangeRecordsResponse>;
    getExchangeRecord: (request: GetExchangeRecordRequest, authContext: AuthContextType) => Promise<GetExchangeRecordResponse>;

    // Driver APIs
    createDriver: (request: CreateDriverRequest, authContext: AuthContextType) => Promise<CreateDriverResponse>;
    queryDrivers: (request: QueryDriversRequest, authContext: AuthContextType) => Promise<QueryDriversResponse>;
    deleteDriver: (request: DeleteDriverRequest, authContext: AuthContextType) => Promise<DeleteDriverResponse>;
    updateDriver: (request: UpdateDriverRequest, authContext: AuthContextType) => Promise<UpdateDriverResponse>;
    getDriver: (request: GetDriverRequest, authContext: AuthContextType) => Promise<GetDriverResponse>;

    // Return APIs
    createReturn: (request: CreateReturnRequest, authContext: AuthContextType) => Promise<CreateReturnResponse>;
    getReturn: (request: GetReturnRequest, authContext: AuthContextType) => Promise<GetReturnResponse>;
    queryReturns: (request: QueryReturnsRequest, authContext: AuthContextType) => Promise<QueryReturnsResponse>;
    deleteReturn: (request: DeleteReturnRequest, authContext: AuthContextType) => Promise<DeleteReturnResponse>;

    // Customer Pricing APIs
    createCustomerPricing: (request: CreateCustomerPricingRequest, authContext: AuthContextType) => Promise<CreateCustomerPricingResponse>;
    queryCustomerPricings: (request: QueryCustomerPricingsRequest, authContext: AuthContextType) => Promise<QueryCustomerPricingsResponse>;
    updateCustomerPricing: (request: UpdateCustomerPricingRequest, authContext: AuthContextType) => Promise<UpdateCustomerPricingResponse>;
    deleteCustomerPricing: (request: DeleteCustomerPricingRequest, authContext: AuthContextType) => Promise<DeleteCustomerPricingResponse>;
}

export const BackendApiContext = createContext<BackendApiContextProps>({} as BackendApiContextProps);

// Create the BackendApiProvider component
const BackendApiProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    // Provide the API methods to the children components
    return (
        <BackendApiContext.Provider value={{
            createInvoice,
            queryInvoiceSummaries,
            deleteInvoice,
            queryInvoiceItems,
            getInvoice,
            updateInvoiceSummary,
            updateInvoiceItem,
            deleteInvoiceItem,
            
            createReceipt,
            deleteReceipt,
            getReceiptsByInvoiceId: queryReceiptsByInvoiceId,
            queryReceipts,
            batchCreateReceipts,

            createCustomer,
            getCustomer,
            deleteCustomer,
            queryCustomers,
            updateCustomer,

            createSalesperson,
            deleteSalesperson,
            querySalespersons,
            updateSalesperson,
            getSalesperson,

            createWarehouse,
            queryWarehouses,
            deleteWarehouse,
            updateWarehouse,
            getWarehouse,

            createInventoryItems,
            queryInventoryItems,
            updateInventoryItem,
            queryInventoryChangeRecords,
            deductInventoryItems,
            transferInventoryItems,
            
            createProduct,
            deleteProduct,
            queryProducts,
            getProduct,
            updateProduct,


            assignCustomerToSalesperson,
            unassignCustomerFromSalesperson: unassignCustomerFromSalesperson,

            sendMessage,

            createPaymentAccount,
            queryPaymentAccounts,
            updatePaymentAccount,
            deletePaymentAccount,
            getPaymentAccount,

            createExchangeRecord,
            deleteExchangeRecord,
            queryExchangeRecords,
            getExchangeRecord,

            createDriver,
            queryDrivers,
            deleteDriver,
            updateDriver,
            getDriver,

            createReturn,
            getReturn,
            queryReturns,
            deleteReturn,

            createCustomerPricing,
            queryCustomerPricings,
            updateCustomerPricing,
            deleteCustomerPricing,
        }}>
            {children}
        </BackendApiContext.Provider>
    );
};

export default BackendApiProvider;