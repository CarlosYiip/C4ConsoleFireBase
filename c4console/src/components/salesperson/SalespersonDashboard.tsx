import { useContext, useEffect, useState } from "react";
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { DateRange, LocalizationProvider } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { zhCN } from "@mui/x-date-pickers-pro";
import { Autocomplete, Button, Dialog, Grid, TextField, Typography, IconButton, DialogTitle, DialogContent, FormControlLabel, Switch } from '@mui/material';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Customer } from '../../api/Customers';
import { GridActionsCellItem, GridColDef, GridRowParams, GridToolbar } from "@mui/x-data-grid";
import { convertIdFormat, buildDisplayNameForProduct } from '../../api/utils';
import { zhCN as DataGridzhCN } from '@mui/x-data-grid/locales';
import { Salesperson } from "../../api/Salespersons";
import { Product } from "../../api/Products";
import { DataGridPremium, useGridApiRef } from "@mui/x-data-grid-premium";
import { createInvoiceSummaryObject, InvoiceTableRowProps } from "../invoice/InvoiceTable";
import CloseIcon from '@mui/icons-material/Close';
import InvoiceOverview from "../invoice/details/InvoiceOverview";
import EditIcon from '@mui/icons-material/Edit';
import { queryClient } from "../../api/Common";

interface PurchasedProductsRow {
    id: string;
    productName?: string;
    price?: number;
    quantity?: number;
    amount: number
}

const SalespersonDashboard = () => {
    // current month
    const currentDate = dayjs();
    // Date selector
    const [value, setValue] = useState<DateRange<Dayjs>>([
        // First day of the last month
        currentDate.subtract(1, 'month').startOf('month'),
        // Last day of the last month
        currentDate.subtract(1, 'month').endOf('month')
    ]);

    const [invoiceTableRows, setInvoiceTableRows] = useState<InvoiceTableRowProps[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | undefined>(undefined);
    const [purchasedProductsRows, setPurchasedProductsRows] = useState<PurchasedProductsRow[]>([]);
    const [paidOnlyPurchaseProductsRows, setPaidOnlyPurchaseProductsRows] = useState<PurchasedProductsRow[]>([]);

    const [openInvoiceDetailsDialog, setOpenInvoiceDetailsDialog] = useState(false);
    const [invoiceDetailsDialogRow, setInvoiceDetailsDialogRow] = useState<GridRowParams<InvoiceTableRowProps> | undefined>(undefined);

    const [showPaidProductsOnly, setShowPaidProductsOnly] = useState(false);

    const [loading, setLoading] = useState(false);
    const [rerender, setRerender] = useState(false);

    const apiContext = useContext(BackendApiContext);

    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);
    const { callApi: queryInvoiceItems } = useApiCall(apiContext.queryInvoiceItems);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);

    const fetchData = async () => {
        setLoading(true);

        const promises = [
            queryCustomers({}).then((response) => {
                setCustomers(response.customers);
            }),
            querySalespersons({}).then((response) => {
                setSalespersons(response.salespersons);
            }),
            queryProducts({}).then((response) => {
                setProducts(response.products);
            })
        ]

        await Promise.all(promises);

        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const invalidateCache = async () => {
        await queryClient.invalidateQueries({ 
            predicate: (query) => {
                const key = query.queryKey[0] as string;
                return key.startsWith('/query_returns') || key.startsWith('/query_invoice_summaries') || key.startsWith('/query_invoice_items');
            }
        });
    }

    const handleSearch = async () => {
        if (!readyForSearch() || value === undefined || value.length !== 2 || value[0] === null || value[1] === null) {
            return;
        }

        await invalidateCache();

        const salespersonId = selectedSalesperson?.salespersonId;
        const startDatetime = value[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endDatetime = value[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');

        // empty the data
        setInvoiceTableRows([]);
        setPurchasedProductsRows([]);
        setPaidOnlyPurchaseProductsRows([]);
        setLoading(true);

        // Use a set to store the invoice ids that have been paid
        const paidInvoiceIds = new Set<string>();
        
        await queryInvoiceSummaries({
            salespersonId: salespersonId,
            startDatetime: startDatetime,
            endDatetime: endDatetime,
            limit: 2000
        }).then((response) => {
            // All the invoices
            setInvoiceTableRows(response.invoiceSummaries.map((it) => {
                return {
                    id: it.invoiceId,
                    createDatetime: it.createDatetime,
                    dueDate: it.dueDate,
                    customerId: it.customerId,
                    salespersonId: it.salespersonId,
                    driverId: it.driverId,
                    shippingClerkName: it.shippingClerkName,
                    billingClerkName: it.billingClerkName,
                    warehouseName: it.warehouseName,
                    totalAmount: it.totalAmount,
                    overridenTotalAmount: it.overridenTotalAmount ?? it.totalAmount,
                    paidAmount: it.paidAmount,
                    notes: it.notes,
                    settlementType: it.settlementType
                }
            }))

            // Only the paid invoices
            response.invoiceSummaries.forEach((it) => {
                if (it.paidAmount >= it.totalAmount) {
                    paidInvoiceIds.add(it.invoiceId);
                }
            });        
        });

        await queryInvoiceItems({
            salespersonId: salespersonId,
            startDatetime: startDatetime,
            endDatetime: endDatetime
        }).then((response) => {
            // All the purchased products
            const purchasedProductsNestedMap = new Map<string, Map<number, number>>();
            const newRows: PurchasedProductsRow[] = []
            response.invoiceItems.forEach((item) => {
                const productId = item.productId;
                const productPrice = item.price;
                const quantity = item.quantity;
                if (!purchasedProductsNestedMap.has(productId)) {
                    const priceMap = new Map<number, number>();
                    priceMap.set(productPrice, quantity);
                    purchasedProductsNestedMap.set(productId, priceMap);
                } else {
                    const priceMap = purchasedProductsNestedMap.get(productId);
                    if (priceMap) {
                        if (priceMap.has(productPrice)) {
                            priceMap.set(productPrice, priceMap.get(productPrice)! + quantity);
                        } else {
                            priceMap.set(productPrice, quantity);
                        }
                    }
                }                
            });
            // Add the row to the table, each entry in the map is a row
            purchasedProductsNestedMap.forEach((priceMap, productId) => {
                priceMap.forEach((quantity, price) => {
                    const rowToAdd = {
                        id: productId + "#" + price,
                        productName: buildDisplayNameForProduct(products.find((product) => product.productId === productId)),
                        price: price,
                        quantity: quantity,
                        amount: price * quantity
                    }

                    newRows.push(rowToAdd)
                })
            })

            setPurchasedProductsRows(newRows)

            // Only the paid purchased products
            const paidOnlyProductsNestedMap = new Map<string, Map<number, number>>();
            const paidOnlyRows: PurchasedProductsRow[] = []
            response.invoiceItems.forEach((item) => {
                const productId = item.productId;
                const productPrice = item.price;
                const quantity = item.quantity;
                const invoiceId = item.invoiceItemId!.split('_')[0];
                if (paidInvoiceIds.has(invoiceId)) {
                    if (!paidOnlyProductsNestedMap.has(productId)) {
                        const priceMap = new Map<number, number>();
                        priceMap.set(productPrice, quantity);
                        paidOnlyProductsNestedMap.set(productId, priceMap);
                    } else {
                        const priceMap = paidOnlyProductsNestedMap.get(productId);
                        if (priceMap) {
                            if (priceMap.has(productPrice)) {
                                priceMap.set(productPrice, priceMap.get(productPrice)! + quantity);
                            } else {
                                priceMap.set(productPrice, quantity);
                            }
                        }
                    }
                }
            })
            paidOnlyProductsNestedMap.forEach((priceMap, productId) => {
                priceMap.forEach((quantity, price) => {
                    const rowToAdd = {
                        id: productId + "#" + price,
                        productName: buildDisplayNameForProduct(products.find((product) => product.productId === productId)),
                        price: price,
                        quantity: quantity,
                        amount: price * quantity
                    }

                    paidOnlyRows.push(rowToAdd)
                })
            })

            setPaidOnlyPurchaseProductsRows(paidOnlyRows);
        });

        
        setLoading(false);
    }

    const readyForSearch = () => {
        return selectedSalesperson !== undefined && value !== undefined;
    }

    const invoiceTableColumns: GridColDef[] = [
        {
            field: 'id',
            headerName: '单号',
            flex: 1,
            valueGetter: (value: string) => {
                if (value === undefined) {
                    return '总计';
                }

                return convertIdFormat(value);
            }
        },
        {
            field: 'createDatetime',
            headerName: '开单日期',
            flex: 1,
            type: 'string',
            valueFormatter: (value: string) => {
                if (value === undefined) {
                    return '';
                }

                return dayjs(value).format('YYYY-MM-DD');
            }
        },
        {
            field: 'settlementType',
            headerName: '结算方式',
            flex: 1,
            valueGetter: (value: number | undefined) => {
                switch (value) {
                    case 0:
                        return '现结';
                    case 1:
                        return '月结';
                    default:
                        return '';
                }
            }
        },
        {
            field: 'customerId',
            headerName: '客户',
            flex: 1,
            valueGetter: (value: string) => {
                if (value === undefined) {
                    return '';
                }

                return customers.find((customer) => customer.customerId === value)?.customerName || '';
            }
        },
        {
            field: 'overridenTotalAmount',
            headerName: '应收金额',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left'
        },
        {
            field: 'paidAmount',
            headerName: '已付金额',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left'
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: '操作',
            width: 100,
            getActions: (row: GridRowParams) => {
                if (row.id === "auto-generated-group-footer-root") {
                    return [];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={
                            () => {
                                setInvoiceDetailsDialogRow(row);
                                setOpenInvoiceDetailsDialog(true);
                            }
                        }
                        color="inherit"
                    />,
                ];
            }
        }
    ]

    const purchasedProductsColumns: GridColDef[] = [
        {
            field: 'productName',
            headerName: '产品',
            flex: 2,
            type: 'string',
            valueGetter: (value: string) => {
                if (value === undefined) {
                    return "总计";
                }

                return value;
            }
        },
        {
            field: 'price',
            headerName: '价格',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left'
        },
        {
            field: 'quantity',
            headerName: '数量',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left'
        },
        {
            field: 'amount',
            headerName: '总价',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left'
        }
    ]

    const apiRef = useGridApiRef()
    const handleReceivedInvoicedItemsOnlyToggle = (checked: boolean) => {
        setShowPaidProductsOnly(checked);
        apiRef.current.setRows(checked ? paidOnlyPurchaseProductsRows : purchasedProductsRows);
        setRerender(!rerender);
    }

    return (

        <Grid container paddingInlineEnd={2} paddingBlock={2} spacing={2}>
            <Grid item xs={3}>
                <Autocomplete
                    loading={loading}
                    disablePortal
                    options={salespersons}
                    getOptionLabel={(salespersons) => salespersons.salespersonName}
                    value={selectedSalesperson}
                    onChange={(event, newValue) => setSelectedSalesperson(newValue || undefined)}
                    renderInput={(params) => <TextField {...params} label="选择业务员" />}
                    isOptionEqualToValue={(option, value) => option.salespersonId === value.salespersonId}
                />
            </Grid>
            <Grid item xs={7}>
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
                    业务员单据记录
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <DataGridPremium
                    autoHeight
                    density="compact"
                    loading={loading}
                    columns={invoiceTableColumns}
                    localeText={DataGridzhCN.components.MuiDataGrid.defaultProps.localeText}
                    rows={invoiceTableRows}
                    slots={{ toolbar: GridToolbar }}
                    initialState={{
                        sorting: { sortModel: [{field: 'overridenTotalAmount', sort: 'desc'}] },
                        pagination: {
                            paginationModel: { pageSize: 50, page: 0 },
                        },
                        aggregation: {
                            model: {
                                overridenTotalAmount: 'sum',
                                paidAmount: 'sum'
                            }
                        }
                    }}
                />
                <Dialog
                    fullWidth
                    maxWidth='xl'
                    open={openInvoiceDetailsDialog}
                    onClose={() => { 
                        setOpenInvoiceDetailsDialog(false)
                        setInvoiceDetailsDialogRow(undefined)
                    }}
                >
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenInvoiceDetailsDialog(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                    <DialogTitle>
                        {invoiceDetailsDialogRow && `订单号: ${convertIdFormat(invoiceDetailsDialogRow.row.id)}`}
                    </DialogTitle>
                    <DialogContent>
                        {invoiceDetailsDialogRow && <InvoiceOverview invoiceSummary={createInvoiceSummaryObject(invoiceDetailsDialogRow.row)}/>}
                    </DialogContent>
                </Dialog>
            </Grid>

            <Grid item xs={12}>
                <Typography fontSize={18}>
                    销售产品汇总
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={showPaidProductsOnly}
                            onChange={(_, checked)  => handleReceivedInvoicedItemsOnlyToggle(checked)}
                            color="primary"
                        />
                    }
                    label="仅显示已收款"
                />
            </Grid>

            <Grid item xs={12}>
                <DataGridPremium
                    apiRef={apiRef}
                    autoHeight
                    density="compact"
                    loading={loading}
                    columns={purchasedProductsColumns}
                    localeText={DataGridzhCN.components.MuiDataGrid.defaultProps.localeText}
                    rows={
                        purchasedProductsRows
                    }
                    initialState={{
                        sorting: { sortModel: [{field: 'amount', sort: 'desc'}] },
                        pagination: {
                            paginationModel: { pageSize: 50, page: 0 },
                        },
                        aggregation: {
                            model: {
                                amount: 'sum'
                            }
                        }
                    }}
                    slots={{ toolbar: GridToolbar }}
                />
            </Grid>
        </Grid>

    );
}

export default SalespersonDashboard;
