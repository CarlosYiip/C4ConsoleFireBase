import { useContext, useEffect, useState } from "react";
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { DateRange, LocalizationProvider } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { zhCN } from "@mui/x-date-pickers-pro";
import { Autocomplete, Button, Checkbox, FormControlLabel, FormGroup, Grid, TextField, Typography } from '@mui/material';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Customer } from '../../api/Customers';
import { GridColDef, GridToolbar } from "@mui/x-data-grid";
import { convertIdFormat, buildDisplayNameForProduct } from '../../api/utils';
import { zhCN as DataGridzhCN } from '@mui/x-data-grid/locales';
import { Salesperson } from "../../api/Salespersons";
import { Product } from "../../api/Products";
import { DataGridPremium } from "@mui/x-data-grid-premium";
import { Warehouse } from "../../api/Warehouses";
import { queryInventoryChangeRecords } from '../../api/InventoryItems';
import { InvoiceSummary } from "../../api/Invoices";

interface Row {
    id: string;
    productType?: string;
    productName?: string;
    type?: string;
    destination?: string;
    quantity: number;
}

const InventoryDashboard = () => {
    // current month
    const currentMonth = dayjs().month();
    // Date selector
    const [value, setValue] = useState<DateRange<Dayjs>>([
        // First day of the current month
        dayjs().month(currentMonth).startOf('month'),
        // Last day of the current month
        dayjs().month(currentMonth).endOf('month')
    ]);

    const [rows, setRows] = useState<Row[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [rerender, setRerender] = useState(false);

    const apiContext = useContext(BackendApiContext);
    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);
    const { callApi: queryInvoiceItems } = useApiCall(apiContext.queryInvoiceItems);
    const { callApi: queryInventoryChangeRecords } = useApiCall(apiContext.queryInventoryChangeRecords);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);

    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        await queryCustomers({}).then((response) => {
            setCustomers(response.customers);
        });
        await querySalespersons({}).then((response) => {
            setSalespersons(response.salespersons);
        });
        await queryProducts({}).then((response) => {
            setProducts(response.products);
        });
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const readyForSearch = () => {
        return value !== undefined;
    }

    const handleSearch = async () => {
        if (!readyForSearch() || value === undefined || value.length !== 2 || value[0] === null || value[1] === null) {
            return;
        }

        const startDatetime = value[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endDatetime = value[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');

        setRows([]);
        setLoading(true);

        const invoiceMap = new Map<string, InvoiceSummary>();

        await queryInvoiceSummaries({
            startDatetime: startDatetime,
            endDatetime: endDatetime,
            limit: 5000
        }).then((response) => {
            response.invoiceSummaries.forEach((summary) => {
                invoiceMap.set(summary.invoiceId, summary);
            });
        });

        if (invoiceMap.size === 0) {
            setLoading(false);
            return;
        }

        // First level key is product id, second level key is customer id
        // Value is quantity
        const soldProductsByCustomerMap = new Map<string, Map<string, number>> ()

        await queryInvoiceItems({
            startDatetime: startDatetime,
            endDatetime: endDatetime
        }).then((response) => {
            response.invoiceItems.forEach((item) => {
                const summary = invoiceMap.get(item.invoiceItemId!.split('_')[0]);
                if (summary === undefined) {
                    return;
                }

                // Aggregate sold products
                const productMap = soldProductsByCustomerMap.get(item.productId);
                if (productMap === undefined) {
                    const newProductMap = new Map<string, number>();
                    newProductMap.set(summary.customerId, item.quantity);
                    soldProductsByCustomerMap.set(item.productId, newProductMap);
                } else {
                    const quantity = productMap.get(summary.customerId);
                    if (quantity === undefined) {
                        productMap.set(summary.customerId, item.quantity);
                    } else {
                        productMap.set(summary.customerId, quantity + item.quantity);
                    }
                }
            });
        });

        // Create a temp array to store the rows
        const tempRows: Row[] = []

        // Populate the rows using the data in the map
        soldProductsByCustomerMap.forEach((map, productId) => {

            const rowsForProduct: Row[] = [];
            const product = products.find((product) => product.productId === productId);

            if (product === undefined) {
                return;
            }

            map.forEach((quantity, customerId) => {
                const customer = customers.find((customer) => customer.customerId === customerId);
                if (customer === undefined || product === undefined) {
                    return;
                }

                const row: Row = {
                    id: `${productId}_${customerId}`,
                    productType: product.type,
                    productName: buildDisplayNameForProduct(product),
                    type: '销售',
                    destination: customer.customerName,
                    quantity: quantity
                }

                rowsForProduct.push(row);
            });

            // Add to the temp array
            tempRows.push(...rowsForProduct);
        })

        setRows(tempRows);

        setLoading(false);
    }

    console.log(rows)

    const columns: GridColDef[] = [
        { field: 'productType', headerName: '品类', width: 0 },
        { field: 'productName', headerName: '产品', width: 0 },
        { field: 'type', headerName: '类型', width: 10, flex: 0.2 },
        { field: 'destination', headerName: '客户/仓库', minWidth: 200, flex: 1 },
        { field: 'quantity', headerName: '数量', minWidth: 100, flex: 0.5, headerAlign: 'left', align: 'left', type: 'number' },
    ];
    
    return (

        <Grid container paddingInlineEnd={2} paddingBlock={2} spacing={2}>
            <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs} localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}>
                    <DateRangePicker
                        value={value}
                        onChange={(newValue) => setValue(newValue)}
                    />
                </LocalizationProvider>
            </Grid>
            <Grid item xs={2}>
                <Button variant="contained" color="primary" onClick={handleSearch} disabled={!readyForSearch()} sx={{height: 50}}>
                    确认
                </Button>
            </Grid>

            <Grid item xs={12}>
                <Typography fontSize={18}>
                    库存变更汇总
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <DataGridPremium
                    autoHeight
                    defaultGroupingExpansionDepth={1}
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                productType: false,
                                productName: false
                            }
                        },
                        sorting: { 
                            sortModel: [{field: 'quantity', sort: 'desc'},] 
                        },
                        rowGrouping: {
                            model: ['productType', 'productName'],
                        },
                        aggregation: {
                            model: {
                                quantity: 'sum'
                            }
                        }
                    }}
                    groupingColDef={{
                        headerName: "品类-产品",
                        minWidth: 300,
                        flex: 1
                    }}
                    density="compact"
                    loading={loading}
                    columns={columns}
                    localeText={DataGridzhCN.components.MuiDataGrid.defaultProps.localeText}
                    rows={rows}
                    slots={{ toolbar: GridToolbar }}
                />
            </Grid>
        </Grid>
    )
}

export default InventoryDashboard;