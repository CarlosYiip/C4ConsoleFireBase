import { CircularProgress, Paper, Tab, Tabs } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { InvoiceSummary } from '../../../api/Invoices';
import React from 'react';
import ExchangeView from './ExchangeView';
import { BackendApiContext } from '../../../api/BackendApiProvider';
import { useApiCall } from '../../hooks/useApiCallWithErrorHandler';
import InvoiceItemsTable from './InvoiceItemsTable';
import { lookUpProductDisplayNameByProductId } from '../../../api/utils';
import { Warehouse } from '../../../api/Warehouses';
import InvoicePrintPage from '../InvoicePrintPage';
import { Product } from '../../../api/Products';
import { Customer } from '../../../api/Customers';
import { Salesperson } from '../../../api/Salespersons';
import { Driver } from '../../../api/Drivers';

export interface InvoiceItemTableRowProps {
    id: string;
    productId?: string;
    productDisplayName?: string;
    quantity?: number;
    price?: number;
    amount?: number;
    warehouseName: string;
    notes?: string;
}
    
interface InvoiceOverviewProps {
    invoiceSummary: InvoiceSummary
}

const InvoiceOverview: React.FC<InvoiceOverviewProps> = ({ invoiceSummary }) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [invoiceItemRows, setInvoiceItemRows] = useState<InvoiceItemTableRowProps[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [rerender, setRerender] = useState(false);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    const apiContext = useContext(BackendApiContext);

    const { callApi: getInvoice } = useApiCall(apiContext.getInvoice);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: queryWarehouses } = useApiCall(apiContext.queryWarehouses); 
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    const { callApi: queryDrivers } = useApiCall(apiContext.queryDrivers);

    const fetchData = async () => {
        setLoading(true);
        await queryProducts({}).then(async (queryProductsResponse) => {         
            setProducts(queryProductsResponse.products);
            await getInvoice({ invoiceId: invoiceSummary.invoiceId, includeInvoiceItems: true }).then((response) => {
                const rows = response.invoiceItems.map((invoiceItem, index) => {
                    return {
                        id: invoiceItem.invoiceItemId || index.toString(),
                        productDisplayName: lookUpProductDisplayNameByProductId(invoiceItem.productId, queryProductsResponse.products),
                        productId: invoiceItem.productId,
                        quantity: invoiceItem.quantity,
                        price: invoiceItem.price,
                        amount: invoiceItem.amount || invoiceItem.quantity * invoiceItem.price,
                        warehouseName: invoiceItem.warehouseName ?? invoiceSummary.warehouseName,
                        notes: invoiceItem.notes
                    }
                });

                setInvoiceItemRows(rows);
            });
        });

        await queryWarehouses({}).then((response) => {
            setWarehouses(response.warehouses);
        });

        await queryCustomers({}).then((response) => {
            setCustomers(response.customers);
        });

        await querySalespersons({}).then((response) => {
            setSalespersons(response.salespersons);
        });

        await queryDrivers({}).then((response) => {
            setDrivers(response.drivers);
        });

        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, [rerender])

    return (
        <div style={{height: '90vh'}}>
            <Paper style={{ margin: 5 }} elevation={3}>
                {
                    loading ? 
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <CircularProgress />
                    </div> :
                    <div>
                        <Tabs
                            orientation='horizontal'
                            variant='scrollable'
                            value={selectedTab}
                            sx={{ borderRight: 1, borderColor: 'divider' }}
                            onChange={handleTabChange}
                        >
                            <Tab label="明细" />
                            <Tab label="打印" />
                        </Tabs>
                        {
                            invoiceItemRows.length > 0 && 
                            selectedTab === 0 && 
                            <InvoiceItemsTable invoiceId={invoiceSummary.invoiceId} />
                        }
                        {
                            invoiceItemRows.length > 0 &&
                            selectedTab === 1 &&
                            <InvoicePrintPage
                                invoiceId={invoiceSummary.invoiceId} 
                                invoiceDate={invoiceSummary.createDatetime} 
                                dueDate={invoiceSummary.dueDate}
                                warehouseName={invoiceSummary.warehouseName} 
                                customerName={
                                    customers.find(customer => customer.customerId === invoiceSummary.customerId)?.customerName || ''
                                } 
                                customerContactNumber={
                                    customers.find(customer => customer.customerId === invoiceSummary.customerId)?.contactNumber || ''
                                } 
                                salespersonName={
                                    salespersons.find(salesperson => salesperson.salespersonId === invoiceSummary.salespersonId)?.salespersonName || ''
                                } 
                                driverName={
                                    drivers.find(driver => driver.driverId === invoiceSummary.driverId)?.driverName || ''
                                }
                                shippingClerkName={invoiceSummary.shippingClerkName || ''}
                                billingClerkName={invoiceSummary.billingClerkName || ''}
                                invoiceItems={
                                    invoiceItemRows.map(row => {
                                        return {
                                            productId: row.productId || '',
                                            quantity: row.quantity || 0,
                                            price: row.price || 0,
                                            notes: row.notes
                                        }
                                    })
                                } 
                                products={products}            
                                notes={invoiceSummary.notes}            
                                overridenTotalAmount={invoiceSummary.overridenTotalAmount}        
                                settlementType={invoiceSummary.settlementType}
                            />
                        }
                    </div>
                }
            </Paper>
        </div>
    );
}

export default React.memo(InvoiceOverview);