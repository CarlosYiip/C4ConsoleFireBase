import { useContext, useEffect, useState } from "react";
import { Customer } from "../../api/Customers";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import dayjs from "dayjs";
import { GridActionsCellItem, GridColDef, GridRowParams, GridToolbar } from "@mui/x-data-grid";
import { buildDisplayNameForProduct, convertIdFormat } from "../../api/utils";
import { DataGridPremium } from "@mui/x-data-grid-premium";
import { zhCN } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Dialog, DialogContent, DialogTitle, IconButton, Table, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { ReturnItem } from "../../api/Returns";
import { Product } from '../../api/Products';
import { Salesperson } from '../../api/Salespersons';

export interface ReturnTableRowProps {
    id: string;
    createDatetime: string;
    customerName: string;
    salespersonName?: string;
    invoiceId?: string;
    totalAmount: number;
    items: ReturnItem[];
}

const ReturnTable: React.FC = () => {
    const [rows, setRows] = useState<ReturnTableRowProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [rerender, setRerender] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogRow, setDialogRow] = useState<GridRowParams<ReturnTableRowProps> | undefined>(undefined);

    const apiContext = useContext(BackendApiContext)

    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: queryReturns } = useApiCall(apiContext.queryReturns);
    const { callApi: deleteReturn } = useApiCall(apiContext.deleteReturn);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);

    const fetchData = async () => {
        setLoading(true);

        var customers: Customer[] = [];
        await queryCustomers({}).then((response) => {
            customers = response.customers;
        });

        var salespersons: Salesperson[] = [];
        await querySalespersons({}).then((response) => {
            salespersons = response.salespersons;
        });

        const currentDatetime = dayjs().format("YYYY-MM-DD HH:mm:ss");
        const lastYearDatetime = dayjs().subtract(1, 'year').format("YYYY-MM-DD HH:mm:ss");

        await queryReturns({
            startDatetime: lastYearDatetime,
            endDatetime: currentDatetime
        }).then((response) => {
            setRows(response.returns.map((it) => {
                return {
                    id: it.returnId,
                    createDatetime: it.createDatetime,
                    customerName: customers.find((customer) => customer.customerId === it.customerId)?.customerName || "",
                    salespersonName: salespersons.find((salesperson) => salesperson.salespersonId === it.salespersonId)?.salespersonName || "",
                    invoiceId: it.invoiceId,
                    totalAmount: it.overridenTotalAmount ?? it.items.reduce((acc, it) => acc + it.quantity * it.price, 0),
                    items: it.items
                }
            }));
        });

        await queryProducts({}).then((response) => {
            setProducts(response.products);
        });

        setLoading(false);
    }
    
    useEffect(() => {
        fetchData();
    }, [rerender]);

    const columns: GridColDef[] = [
        { 
            field: 'id', 
            headerName: '退货单号', 
            flex: 1,
            valueGetter: (value: string) => { 
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
            headerName: '业务员',
            flex: 1,
        },
        { 
            field: 'invoiceId', 
            headerName: '发货单号', 
            flex: 1,
        },
        { 
            field: 'totalAmount', 
            headerName: '金额', 
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            flex: 1
        },
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
                                await deleteReturn(
                                    { returnId: row.id.toString() }
                                ).finally(() => {
                                    setLoading(false);
                                });
                                setRerender(!rerender);
                            }
                        }
                        color="inherit"
                    />,
                ];
            }
        }
    ]

    return (
        <div>
            <DataGridPremium
                initialState={{
                    pinnedColumns: { right: ["actions"] },
                    sorting: { sortModel: [{ field: 'id', sort: 'desc' }] },
                }}
                pageSizeOptions={[100]}
                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                density='compact'
                columns={columns}
                rows={rows}

                checkboxSelection={false}
                disableRowSelectionOnClick={false}

                slots={{ toolbar: GridToolbar }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                    },
                }}

                loading={loading}
                hideFooter
            />

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
                    onClick={() => setOpenDialog(false)}
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
                    {dialogRow && `退货单号: ${convertIdFormat(dialogRow.row.id)}`}
                </DialogTitle>
                <DialogContent>
                    {dialogRow && (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>商品</TableCell>
                                        <TableCell>数量</TableCell>
                                        <TableCell>单价</TableCell>
                                        <TableCell>金额</TableCell>
                                    </TableRow>
                                    {dialogRow.row.items.map((item) => {
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
        </div>
    );
}

export default ReturnTable;