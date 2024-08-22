import { useContext, useEffect, useState } from "react";
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { DateRange, LocalizationProvider } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { zhCN } from "@mui/x-date-pickers-pro";
import { Autocomplete, Button, Checkbox, Dialog, DialogContent, DialogTitle, FormControlLabel, FormGroup, Grid, IconButton, Table, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Customer } from '../../api/Customers';
import { GridActionsCellItem, GridColDef, GridRowParams, GridRowSelectionModel, GridSlots, GridToolbar, GridToolbarContainer } from "@mui/x-data-grid";
import { convertIdFormat, buildDisplayNameForProduct } from '../../api/utils';
import { zhCN as DataGridzhCN } from '@mui/x-data-grid/locales';
import { Salesperson } from "../../api/Salespersons";
import { Product } from "../../api/Products";
import { DataGridPremium,   GridExceljsProcessInput } from "@mui/x-data-grid-premium";
import { InvoiceItem } from "../../api/Invoices";
import CloseIcon from '@mui/icons-material/Close';
import InvoiceOverview from "../invoice/details/InvoiceOverview";
import { createInvoiceSummaryObject, InvoiceTableRowProps } from "../invoice/InvoiceTable";
import EditIcon from '@mui/icons-material/Edit';
import { ReturnTableRowProps } from "../return/ReturnTable";
import { ReturnItem } from "../../api/Returns";
import { queryClient } from "../../api/Common";
import { PaymentAccount } from '../../api/PaymentAccounts';

interface ToolBarProps {
    accounts: PaymentAccount[];
    invoiceTableRowSelectionModel: GridRowSelectionModel;
    selectedAccount: PaymentAccount | undefined;
    setSelectedAccount: (account: PaymentAccount | undefined) => void;
    handleBatchCreateReceipts: () => void;
    readyForBatchCreateReceipts: () => boolean;
}

const ToolBar = (
    props: ToolBarProps
) => {
    return (
        <GridToolbarContainer>
            <Button variant="contained" color="primary" onClick={props.handleBatchCreateReceipts} disabled={!props.readyForBatchCreateReceipts()}>
                一键销帐(单次最多50单)
            </Button>

            <Autocomplete
                disabled={props.invoiceTableRowSelectionModel.length === 0}
                size="small"
                disablePortal
                loading={props.accounts.length === 0}
                options={props.accounts}
                getOptionLabel={(account) => account.accountName}
                value={props.selectedAccount}
                onChange={(event, newValue) => {
                    if (newValue != null) {
                        props.setSelectedAccount(newValue);
                    }
                }}
                renderInput={(params) => <TextField {...params} label="选择收款账户" />}
                isOptionEqualToValue={(option, value) => option.paymentAccountId === value.paymentAccountId}
                sx={{ minWidth: 200 }}
            />

            <GridToolbar showQuickFilter />

        </GridToolbarContainer>
    )
}

interface PurchasedProductsRow {
    id: string;
    productName?: string; // This is nullable because of the aggregation row
    price?: number; // This is nullable because of the aggregation row
    quantity?: number; // This is nullable because of the aggregation row
    amount: number
}

interface ReturnProductsRow {
    id: string;
    productName?: string; // This is nullable because of the aggregation row
    price?: number; // This is nullable because of the aggregation row
    quantity?: number; // This is nullable because of the aggregation row
    amount: number
}

const CustomerDashboard = () => {
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
    const [invoiceTableRowSelectionModel, setInvoiceTableRowSelectionModel] = useState<GridRowSelectionModel>([]);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | undefined>(undefined);
    const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
    const [purchasedProductsRows, setPurchasedProductsRows] = useState<PurchasedProductsRow[]>([]);
    const [settlementType, setSettlementType] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [rerender, setRerender] = useState(false);
    const [openInvoiceDetailsDialog, setOpenInvoiceDetailsDialog] = useState(false);
    const [invoiceDetailsDialogRow, setInvoiceDetailsDialogRow] = useState<GridRowParams<InvoiceTableRowProps> | undefined>(undefined);

    const [returnTableRows, setReturnTableRows] = useState<ReturnTableRowProps[]>([]);
    const [returnProductsRows, setReturnProductsRows] = useState<ReturnProductsRow[]>([]);
    const [openReturnDetailsDialog, setOpenReturnDetailsDialog] = useState(false);
    const [returnDetailsDialogRow, setReturnDetailsDialogRow] = useState<GridRowParams<ReturnTableRowProps> | undefined>(undefined);

    const apiContext = useContext(BackendApiContext);

    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);
    const { callApi: queryInvoiceItems } = useApiCall(apiContext.queryInvoiceItems);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: queryReturns } = useApiCall(apiContext.queryReturns);
    const { callApi: batchCreateReceipts } = useApiCall(apiContext.batchCreateReceipts);
    const { callApi: queryPaymentAccounts } = useApiCall(apiContext.queryPaymentAccounts);

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
            }),
            queryPaymentAccounts({}).then((response) => {
                setAccounts(response.paymentAccounts);
            })
        ];
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
                return key.startsWith('/query_returns') || 
                key.startsWith('/query_invoice_summaries') || 
                key.startsWith('/query_invoice_items') || 
                key.startsWith('/query_receipts')
            }
        });
    }

    const handleSearch = async () => {
        if (!readyForSearch() || value === undefined || value.length !== 2 || value[0] === null || value[1] === null) {
            return;
        }

        await invalidateCache();

        const startDatetime = value[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endDatetime = value[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');

        // empty the data
        setInvoiceTableRows([]);
        setPurchasedProductsRows([]);
        setReturnTableRows([]);
        setReturnProductsRows([]);
        setLoading(true);
        
        const invoiceSet = new Set();
        const allInvoiceItems: InvoiceItem[] = [];
        const allReturnItems: ReturnItem[] = [];
        const purchasedProductsNestedMap = new Map<string, Map<number, number>>();
        const returnProductsNestedMap = new Map<string, Map<number, number>>();

        // For each customer, query the invoice summaries and invoice items
        const promises = selectedCustomers.map(async (customer) => {
            const customerId = customer?.customerId;
            const invoiceSummariesPromise = queryInvoiceSummaries({
                customerId: customerId,
                startDatetime: startDatetime,
                endDatetime: endDatetime,
                settlementType: settlementType === 1 ? 1 : undefined,
                limit: 2000
            }).then((response) => {
                const newRows: InvoiceTableRowProps[] = [];
                response.invoiceSummaries.forEach((it) => {
                    const rowToAdd = {
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
                    newRows.push(rowToAdd);
                    invoiceSet.add(it.invoiceId);
                });
                setInvoiceTableRows((prev) => [...prev, ...newRows]);
            });

            const invoiceItemsPromise = queryInvoiceItems({
                customerId: customerId,
                startDatetime: startDatetime,
                endDatetime: endDatetime
            }).then((response) => {
                response.invoiceItems.filter((item) => {
                    // Only include the items that are in the invoice set, to filter the invoice by settlement type
                    return invoiceSet.has(item.invoiceItemId?.split("_")[0]);
                }).forEach((item) => {
                    allInvoiceItems.push(item);
                });
            });

            const returnItemsPromise = queryReturns({
                startDatetime: startDatetime,
                endDatetime: endDatetime,
                customerId: customerId
            }).then((response) => {
                const newRows: ReturnTableRowProps[] = [];
                response.returns.forEach((it) => {
                    allReturnItems.push(...it.items);
                    const rowToAdd = {
                        id: it.returnId,
                        createDatetime: it.createDatetime,
                        customerName: customers.find((customer) => customer.customerId === it.customerId)?.customerName || "",
                        salespersonName: salespersons.find((salesperson) => salesperson.salespersonId === it.salespersonId)?.salespersonName || "",
                        invoiceId: it.invoiceId,
                        totalAmount: it.overridenTotalAmount ?? it.items.reduce((acc, it) => acc + it.quantity * it.price, 0),
                        items: it.items
                    }
                    newRows.push(rowToAdd);
                })

                setReturnTableRows((prev) => [...prev, ...newRows]);
            });

            return Promise.all([invoiceSummariesPromise, invoiceItemsPromise, returnItemsPromise]);
        });
        await Promise.all(promises)

        // Aggregate the purchased products from all the customers
        allInvoiceItems.forEach((item) => {
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
                setPurchasedProductsRows((prev) => [...prev, rowToAdd])
            })
        })

        // Aggregate the returned products from all the customers
        allReturnItems.forEach((item) => {
            const productId = item.productId;
            const productPrice = item.price;
            const quantity = item.quantity;
            if (!returnProductsNestedMap.has(productId)) {
                const priceMap = new Map<number, number>();
                priceMap.set(productPrice, quantity);
                returnProductsNestedMap.set(productId, priceMap);
            } else {
                const priceMap = returnProductsNestedMap.get(productId);
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
        returnProductsNestedMap.forEach((priceMap, productId) => {
            priceMap.forEach((quantity, price) => {
                const rowToAdd = {
                    id: productId + "#" + price,
                    productName: buildDisplayNameForProduct(products.find((product) => product.productId === productId)),
                    price: price,
                    quantity: quantity,
                    amount: price * quantity
                }
                setReturnProductsRows((prev) => [...prev, rowToAdd])
            })
        })

        setRerender(!rerender);
        setLoading(false);
    }

    const readyForSearch = () => {
        return selectedCustomers.length != 0 && value !== undefined;
    }

    const handleBatchCreateReceipts = async () => {
        setLoading(true);
        if (!readyForBatchCreateReceipts()) {
            return;
        }

        if (selectedAccount === undefined) {
            return;
        }

        const invoiceIds = invoiceTableRowSelectionModel.map((it) => it as string);
        await batchCreateReceipts({
            invoiceIds: invoiceIds,
            paymentAccountId: selectedAccount.paymentAccountId
        }).finally(() => {
            setLoading(false);
        });

        // Update the paid amount in the invoice table
        const newInvoiceTableRows = invoiceTableRows.map((it) => {
            if (invoiceIds.includes(it.id)) {
                return {
                    ...it,
                    paidAmount: it.overridenTotalAmount
                }
            }
            return it;
        });
        setInvoiceTableRows(newInvoiceTableRows);

        // Clear the selection
        setInvoiceTableRowSelectionModel([]);

        await invalidateCache();
    }

    const readyForBatchCreateReceipts = () => {
        return invoiceTableRowSelectionModel.length > 0 && selectedAccount !== undefined;
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
            valueFormatter: (value) => {
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
            field: 'salespersonId',
            headerName: '业务员',
            flex: 1,
            valueGetter: (value: string) => {
                if (value === undefined) {
                    return '';
                }

                return salespersons.find((salesperson) => salesperson.salespersonId === value)?.salespersonName || '';
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
            disableExport: true,
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
            headerName: '金额',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left'
        },
        {
            field: 'notes',
            headerName: '备注',
            flex: 0.2,
        }
    ]

    const returnTableColumns: GridColDef[] = [
        { 
            field: 'id', 
            headerName: '退货单号', 
            flex: 1,
            valueGetter: (value: string) => { 
                if (value === undefined) {
                    return '总计'
                }
                return convertIdFormat(value) 
            } 
        },
        { 
            field: 'createDatetime', 
            headerName: '日期时间', 
            flex: 1,
        },
        {
            field: 'customerName',
            headerName: '客户',
            flex: 1,
        },
        {
            field: 'salespersonName',
            headerName: "业务员",
            flex: 1,
        },
        {
            field: 'invoiceId',
            headerName: '发货单号',
            flex: 1
        },
        {
            field: 'totalAmount',
            headerName: '金额',
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
                                setReturnDetailsDialogRow(row);
                                setOpenReturnDetailsDialog(true);
                            }
                        }
                        color="inherit"
                    />,
                ];
            }
        }
    ]

    const returnProductsColumn: GridColDef[] = [
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
            headerName: '金额',
            flex: 1,
            type: 'number',
            align: 'left',
            headerAlign: 'left'
        }
    ]

    const exceljsPreProcess = ({ workbook, worksheet }: GridExceljsProcessInput) => {
        const customerNames = selectedCustomers.map((customer) => customer.customerName).join(', ');
        const period = value.map((date) => date!.format('YYYY-MM-DD')).join(' - ');
        worksheet.addRow([`客户: ${customerNames}`, '', `日期: ${period}`, '']);

        // Merge the cells
        worksheet.mergeCells('A1', 'B1');
        worksheet.mergeCells('C1', 'D1');
    };

    const exceljsPostProcess = ({ worksheet }: GridExceljsProcessInput) => {
    };

    const excelOptions = { exceljsPreProcess, exceljsPostProcess };

    return (
        <Grid container paddingInlineEnd={2} paddingBlock={2} spacing={2}>
            <Grid item xs={3}>
                <Autocomplete
                    multiple
                    loading={loading}
                    disablePortal
                    options={customers}
                    getOptionLabel={(customer) => customer.customerName}
                    value={selectedCustomers.length === 0 ? undefined : selectedCustomers}
                    onChange={(event, newValue) => 
                        setSelectedCustomers(newValue)
                    }
                    renderInput={(params) => <TextField {...params} label="选择客户" />}
                    isOptionEqualToValue={(option, value) => option.customerId === value.customerId}
                />
            </Grid>
            <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs} localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}>
                    <DateRangePicker
                        value={value}
                        onChange={(newValue) => setValue(newValue)}
                    />
                </LocalizationProvider>
            </Grid>
            <Grid item xs={1}>
                <FormGroup>
                    <FormControlLabel control={
                        <Checkbox 
                            defaultChecked 
                            onChange={(event) => setSettlementType(event.target.checked ? 1 : 0)}
                        />
                    } label="仅月结" />
                </FormGroup>
            </Grid>
            <Grid item xs={2}>
                <Button variant="contained" color="primary" onClick={handleSearch} disabled={!readyForSearch()} sx={{height: 50}}>
                    确认
                </Button>
            </Grid>

            <Grid item xs={12}>
                <Typography fontSize={18}>
                    客户发货记录
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <DataGridPremium
                    autoHeight
                    checkboxSelection
                    isRowSelectable={(params: GridRowParams) => {
                        return params.row.paidAmount != params.row.overridenTotalAmount;
                    }}
                    density="compact"
                    loading={loading}
                    columns={invoiceTableColumns}
                    localeText={DataGridzhCN.components.MuiDataGrid.defaultProps.localeText}
                    rows={invoiceTableRows}
                    slots={
                        { toolbar: ToolBar as GridSlots['toolbar'] }
                    }
                    slotProps={{
                        toolbar: {
                            accounts: accounts,
                            invoiceTableRowSelectionModel: invoiceTableRowSelectionModel,
                            selectedAccount: selectedAccount,
                            setSelectedAccount: setSelectedAccount,
                            handleBatchCreateReceipts: handleBatchCreateReceipts,
                            readyForBatchCreateReceipts: readyForBatchCreateReceipts
                        }
                    }}
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
                    onRowSelectionModelChange={(newRowSelectionModel) => {
                        setInvoiceTableRowSelectionModel(newRowSelectionModel);
                    }}
                    rowSelectionModel={invoiceTableRowSelectionModel}
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
                    购买产品汇总
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <DataGridPremium
                    autoHeight
                    density="compact"
                    loading={loading}
                    columns={purchasedProductsColumns}
                    localeText={DataGridzhCN.components.MuiDataGrid.defaultProps.localeText}
                    rows={purchasedProductsRows}
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
                    slotProps={{ toolbar: { excelOptions } }}
                />
            </Grid>

            <Grid item xs={12}>
                <Typography fontSize={18}>
                    客户退货记录
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <DataGridPremium
                    autoHeight
                    density='compact'
                    loading={loading}
                    localeText={DataGridzhCN.components.MuiDataGrid.defaultProps.localeText}
                    columns={returnTableColumns}
                    rows={returnTableRows}
                    initialState={{
                        sorting: { sortModel: [{ field: 'totalAmount', sort: 'desc' }] },
                        pagination: {
                            paginationModel: { pageSize: 50, page: 0 },
                        },
                        aggregation: {
                            model: {
                                totalAmount: 'sum'
                            }
                        }
                    }}
                    slots={{ toolbar: GridToolbar }}
                />

                <Dialog
                    fullWidth
                    maxWidth='xl'
                    open={openReturnDetailsDialog}
                    onClose={() => { 
                        setOpenReturnDetailsDialog(false)
                        setReturnDetailsDialogRow(undefined)
                    }}
                >
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenReturnDetailsDialog(false)}
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
                        {returnDetailsDialogRow && `退货单号: ${convertIdFormat(returnDetailsDialogRow.row.id)}`}
                    </DialogTitle>
                    <DialogContent>
                        {returnDetailsDialogRow && (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>商品</TableCell>
                                            <TableCell>数量</TableCell>
                                            <TableCell>单价</TableCell>
                                            <TableCell>金额</TableCell>
                                        </TableRow>
                                        {returnDetailsDialogRow.row.items.map((item) => {
                                            const product = products.find((product) => product.productId === item.productId);
                                            return (
                                                <TableRow key={item.productId}>
                                                    <TableCell>{buildDisplayNameForProduct(product)}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>{item.price}</TableCell>
                                                    <TableCell>{item.quantity * item.price}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableHead>
                                </Table>
                            </TableContainer>
                        )}
                    </DialogContent>
                </Dialog>
            </Grid>

            <Grid item xs={12}>
                <Typography fontSize={18}>
                    退货产品汇总
                </Typography>
            </Grid>
                    
            <Grid item xs={12}>
                <DataGridPremium
                    autoHeight
                    density="compact"
                    loading={loading}
                    columns={returnProductsColumn}
                    localeText={DataGridzhCN.components.MuiDataGrid.defaultProps.localeText}
                    rows={returnProductsRows}
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

export default CustomerDashboard;
