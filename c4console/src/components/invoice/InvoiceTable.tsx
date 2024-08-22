import { DataGridPremium, GridActionsCellItem, GridColDef, GridFilterModel, GridPaginationMeta, GridRowParams, GridToolbar } from '@mui/x-data-grid-premium';
import { useContext, useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import React from 'react';
import { BackendApiContext } from '../../api/BackendApiProvider';
import { deleteInvoice, QueryInvoiceSummariesRequest } from '../../api/Invoices';
import { AuthContext } from '../auth/AuthProvider';
import { Salesperson } from '../../api/Salespersons';
import { Customer } from '../../api/Customers';
import { convertIdFormat } from '../../api/utils';
import { zhCN } from '@mui/x-data-grid/locales';
import InvoiceOverview from './details/InvoiceOverview';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Driver } from '../../api/Drivers';
import { useApiCall } from '../hooks/useApiCallWithErrorHandler';

const PAGE_SIZE = 2000;

export interface InvoiceTableRowProps {
    id: string;
    createDatetime: string;
    dueDate: string;
    customerId: string;
    salespersonId: string;
    driverId?: string;
    shippingClerkName?: string;
    billingClerkName?: string;
    warehouseName: string;
    totalAmount: number;
    overridenTotalAmount: number;
    paidAmount: number;
    notes?: string; 
    settlementType?: number;
}

const InvoiceTable = () => {
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs(new Date()).subtract(1, 'year'));
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs(new Date()).set('hour', 23).set('minute', 59).set('second', 59));
    const [loading, setLoading] = useState(true);
    const [rerender, setRerender] = useState(false);
    const [forceRerenderByChild, setForceRerenderByChild] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogRow, setDialogRow] = useState<GridRowParams<InvoiceTableRowProps> | undefined>(undefined);
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    
    const [allRows, setAllRows] = useState<InvoiceTableRowProps[]>([]);
    const [visitedPages, setVisistedPages] = useState<number[]>([]);
    const [hasNextPage, setHasNextPage] = useState<boolean | undefined>(true);
    const [paginationModel, setPaginationModel] = useState({ pageSize: PAGE_SIZE, page: 0 });
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | undefined>(undefined);

    const apiContext = useContext(BackendApiContext)
    const authContext = useContext(AuthContext);

    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    const { callApi: queryDrivers } = useApiCall(apiContext.queryDrivers);
    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);

    const customerNameToIdMap = new Map<string, string>();
    const salespersonNameToIdMap = new Map<string, string>();

    const queryInvoiceSummariesPaginationHelper = async (
        model: { pageSize: number; page: number },
        filters?: { 
            customerId?: string,
            salespersonId?: string,
            settlementType?: number
        }
    ) => {
        // If the page has been visited, no need to query again
        if (visitedPages.includes(model.page)) {
            setPaginationModel(model);
            return;
        }

        const request: QueryInvoiceSummariesRequest = {
            startDatetime: startDate?.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
            endDatetime: endDate?.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
            limit: PAGE_SIZE,
            lastEvaluatedKey: lastEvaluatedKey,
            customerId: filters?.customerId,
            salespersonId: filters?.salespersonId,
            settlementType: filters?.settlementType
        }
        await queryInvoiceSummaries(request).then((response) => {
            setAllRows([...allRows, ...response.invoiceSummaries.map((it) => {
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
            })]);
            setLastEvaluatedKey(response.lastEvaluatedKey);
            setHasNextPage(response.lastEvaluatedKey !== null);
            setVisistedPages([...visitedPages, model.page]);
        })
    }

    // TODO - Timezone
    const fetchData = async () => {
        setLoading(true);
        await queryInvoiceSummariesPaginationHelper(paginationModel);
        await queryCustomers({}).then((response) => {
            setCustomers(response.customers);
            response.customers.forEach((it) => {
                customerNameToIdMap.set(it.customerName, it.customerId);
            })
        });
        await querySalespersons({}).then((response) => {
            setSalespersons(response.salespersons);
            response.salespersons.forEach((it) => {
                salespersonNameToIdMap.set(it.salespersonName, it.salespersonId);
            })
        });
        await queryDrivers({}).then((response) => {
            setDrivers(response.drivers);
        });
        setLoading(false);
    }

    const clearPagination = () => {
        setAllRows([]);
        setVisistedPages([]);
        setHasNextPage(true);
        setPaginationModel({ pageSize: PAGE_SIZE, page: 0 });
        setLastEvaluatedKey(undefined);
    }

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const columns: GridColDef[] = [
        { 
            field: 'id',
            headerName: '单号', 
            width: 150, 
            valueGetter: (value: string) => { 
                return convertIdFormat(value) 
            }
        },
        { 
            field: 'createDatetime', 
            headerName: '日期时间', 
            width: 150, 
            type: 'dateTime',
            valueFormatter: (value) => {
                return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
            } 
        },
        { 
            field: 'settlementType', 
            headerName: '结算方式', 
            width: 100, 
            valueGetter: (value?: number) => { 
                if (value === undefined) {
                    return ''
                }

                return value === 0 ? '现结' : '月结' 
            }
        },
        // { 
        //     field: 'dueDate', 
        //     headerName: '结算日期', 
        //     width: 200,
        //     renderCell: (params: any) => {
        //         return (
        //             <DatePicker
        //                 value={dayjs(params.row.dueDate)}
        //                 onChange={(newDueDate: any) => { handleDueDateChange(newDueDate, params.row) }}
        //             />
        //         )
        //     }
        // },
        { field: 'customerId', headerName: '客户', width: 150, valueGetter: (value: string) => { return customers.find((it) => it.customerId === value)?.customerName }},
        { field: 'salespersonId', headerName: '业务员', width: 150, valueGetter: (value: string) => { return salespersons.find((it) => it.salespersonId === value)?.salespersonName }},
        // { field: 'driverId', headerName: '送货员', width: 150, valueGetter: (value: string) => { return drivers.find((it) => it.driverId === value)?.driverName}},
        { field: 'shippingClerkName', headerName: '发货员', width: 150 },
        { field: 'billingClerkName', headerName: '开票员', width: 150 },
        { field: 'warehouseName', headerName: '仓库', width: 100 },
        // { field: 'totalAmount', headerName: '开票金额', width: 150 },
        { field: 'overridenTotalAmount', headerName: '应收金额', width: 150 },
        { field: 'paidAmount', headerName: '已收金额', width: 150 },
        {
            field: 'actions',
            type: 'actions',
            headerName: '操作',
            width: 100,
            getActions: (row: GridRowParams) => {
                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={
                            () => {
                                setDialogRow(row);
                                setOpenDialog(true);
                            }
                        }
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={
                            async () => {
                                const confirmed = window.confirm('确认删除？');
                                if (!confirmed) {
                                    return;
                                }
                                setLoading(true);
                                await deleteInvoice({invoiceId: row.id.toString()}, authContext);
                                clearPagination();
                                setLoading(false);
                                setRerender(!rerender);
                            }
                        }
                        color="inherit"
                    />,
                ];
            }
        }
    ];
    
    const paginationMetaRef = React.useRef<GridPaginationMeta>();
    
    const paginationMeta = React.useMemo(() => {
        if (hasNextPage !== undefined && paginationMetaRef.current?.hasNextPage !== hasNextPage) {
            paginationMetaRef.current = { hasNextPage };
        }
        return paginationMetaRef.current;
    }, [hasNextPage]);
    
    const paginationModelChangeHandler = async (newPaginationModel: { pageSize: number; page: number }) => {
        setLoading(true);
        await queryInvoiceSummariesPaginationHelper(newPaginationModel);
        setPaginationModel(newPaginationModel);
        setLoading(false);
    }

    return (
        <div style={{ height: '90vh', width: '90vw', margin: 10 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DataGridPremium
                initialState={{
                    pagination: { rowCount: -1, paginationModel: paginationModel },
                    pinnedColumns: { right: ["actions"] },
                    sorting: { sortModel: [{ field: 'id', sort: 'desc' }] },
                }}
                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                rows={allRows.slice(paginationModel.page * paginationModel.pageSize, (paginationModel.page + 1) * paginationModel.pageSize)}
                loading={loading}
                columns={columns} 
                checkboxSelection={false}
                disableRowSelectionOnClick={false}
                density='compact'
                // Pagination settings
                pagination
                paginationMode='server'
                paginationMeta={paginationMeta}
                paginationModel={paginationModel}
                onPaginationModelChange={paginationModelChangeHandler}
                pageSizeOptions={[PAGE_SIZE]}

                // Tools
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                    },
                }}

                // filterMode='server'
                // onFilterModelChange={onFilterChange}
            />
            </LocalizationProvider>
            <Dialog
                fullWidth
                maxWidth='xl'
                open={openDialog}
                onClose={() => { 
                    setOpenDialog(false)
                    setDialogRow(undefined)
                }}
            >
                <IconButton
                    aria-label="close"
                    onClick={() => {
                        setOpenDialog(false)
                        setRerender(!rerender)
                        setForceRerenderByChild(true)
                    }}
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
                    {dialogRow && `订单号: ${convertIdFormat(dialogRow.row.id)}`}
                </DialogTitle>
                <DialogContent>
                    {dialogRow && <InvoiceOverview invoiceSummary={createInvoiceSummaryObject(dialogRow.row)}/>}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default React.memo(InvoiceTable);

export const createInvoiceSummaryObject = (row: InvoiceTableRowProps) => {
    return {
        invoiceId: row.id,
        createDatetime: row.createDatetime,
        dueDate: row.dueDate,
        customerId: row.customerId,
        salespersonId: row.salespersonId,
        driverId: row.driverId,
        shippingClerkName: row.shippingClerkName,
        billingClerkName: row.billingClerkName,
        warehouseName: row.warehouseName,
        totalAmount: row.totalAmount,
        overridenTotalAmount: row.overridenTotalAmount,
        paidAmount: row.paidAmount,
        notes: row.notes,
        settlementType: row.settlementType
    }
}