import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { InvoiceSummary } from '../../../api/Invoices';
import { Button, CircularProgress, Grid, Typography } from '@mui/material';
import CustomDataGrid from '../../common/CustomDataGrid';
import { GridColDef, GridRowModel, GridRowModesModel } from '@mui/x-data-grid-premium';
import { Warehouse } from '../../../api/Warehouses';
import { InvoiceItemTableRowProps } from './InvoiceOverview';
import { BackendApiContext } from '../../../api/BackendApiProvider';
import { useApiCall } from '../../hooks/useApiCallWithErrorHandler';

interface ExchangeViewProps {
    invoiceSummary: InvoiceSummary;
    invoiceItemRows: InvoiceItemTableRowProps[];
    warehouses: Warehouse[];
    rerender: boolean;
    setRerender: Dispatch<SetStateAction<boolean>>;
}

interface ExistingItemTableRowProps {
    id: string;
    productId?: string;
    productDisplayName?: string;
    quantity?: number;
    price?: number;
    amount?: number;
    returnQuantity: number;
    originWarehouseName: string;
    returnWarehouseName: string;
}

const ExchangeView: React.FC<ExchangeViewProps> = ({ invoiceSummary, invoiceItemRows, warehouses, rerender, setRerender }) => {
    const [loading, setLoading] = useState(false);;
    const [existingItemRows, setExistingItemRows] = useState<ExistingItemTableRowProps[]>([]);
    const [existingItemRowModesModel, setExistingItemRowModesModel] = useState<GridRowModesModel>({});

    const apiContext = useContext(BackendApiContext);
    const { callApi: createExchangeRecord } = useApiCall(apiContext.createExchangeRecord);

    const align = 'left';

    const existingItemColumns: GridColDef[] = [
        { 
            field: 'productDisplayName', 
            headerName: '产品', 
            flex: 2,
            type: 'string', 
            headerAlign: align, 
            align: align 
        },
        { 
            field: 'returnQuantity', 
            headerName: '退货数量', 
            headerAlign: align,
            align: align,
            type: 'number',
            flex: 1,
            editable: true,
            valueParser: (value, row) => {
                if (value > row.quantity || value <= 0) {
                    return parseInt(row.quantity);
                } else {
                    return parseInt(value);
                }
            }
        },
        { 
            field: 'quantity', 
            headerName: '数量', 
            flex: 1,
            type: 'number',
            headerAlign: align,
            align: align,
        },
        { 
            field: 'price', 
            headerName: '单价', 
            flex: 1,
            type: 'number',
            headerAlign: align,
            align: align,
        },
        { 
            field: 'amount', 
            headerName: '金额', 
            flex: 1,
            type: 'number',
            editable: false,
            valueParser: (value) => {
                if (value < 0) {
                    return 0;
                } else {
                    return parseFloat(value);
                }
            },
            headerAlign: align,
            align: align,
        },
        { 
            field: 'originWarehouseName', 
            headerName: '发货仓库', 
            flex: 1,
            headerAlign: align, 
            align: align
        },
        {
            field: 'returnWarehouseName',
            headerName: '退货仓库',
            flex: 1,
            type: 'singleSelect',
            editable: true,
            valueOptions: warehouses.map((warehouse) => { 
                return  {
                    value: warehouse.warehouseName, 
                    label: warehouse.warehouseName
                }
            }),
            headerAlign: align,
            align: align
        }
    ]

    useEffect(() => {
        setExistingItemRows(
            invoiceItemRows.map((invoiceItem) => {
                return {
                    ...invoiceItem,
                    returnQuantity: 0,
                    originWarehouseName: invoiceItem.warehouseName ?? invoiceSummary.warehouseName,
                    returnWarehouseName: invoiceItem.warehouseName ?? invoiceSummary.warehouseName
                }
            })
        );
    }, []);

    const convertExistingItemRowsToReturnItems = () => {
        return existingItemRows.filter(
            (row) => row.returnQuantity > 0
        ).map((row) => {
            return {
                invoiceItemId: row.id,
                quantity: row.returnQuantity,
                returnWarehouseName: row.returnWarehouseName
            }
        })
    }

    const isReadyToSubmit = () => {
        return convertExistingItemRowsToReturnItems().length != 0;
    }

    const handleSubmit = async () => {
        const returnItems = convertExistingItemRowsToReturnItems();
        setLoading(true);

        await createExchangeRecord({
            invoiceId: invoiceSummary.invoiceId,
            returnItems: returnItems,
            newItems: []
        }).finally(() => {
            setLoading(false);
        });
            
        handleClearAll();
        setRerender(!rerender);
    }

    const handleClearAll = () => {
        // For the existing items, we need to reset the return quantity and return warehouse
        const newExistingItemRows = existingItemRows.map((row) => {
            return {
                ...row,
                returnQuantity: 0,
                returnWarehouseName: row.originWarehouseName
            }
        })

        setExistingItemRows(newExistingItemRows);
        setRerender(!rerender);
    }

    return (
        <div>
            <Grid container >
                <Grid item xs={12} paddingTop={1}>
                    <CustomDataGrid
                        columns={existingItemColumns}
                        initialState={{
                            columns: { columnVisibilityModel: { id: false } },
                        }}

                        rows={existingItemRows}
                        setRows={setExistingItemRows}

                        rowModesModel={existingItemRowModesModel}
                        setRowModesModel={setExistingItemRowModesModel}

                        loading={loading}
                        setLoading={setLoading}

                        rerender={rerender}
                        setRerender={setRerender}

                        fetchData={async () => { }}
                        
                        processRowUpdate={async (newRow: GridRowModel, oldRow: GridRowModel) => { 
                            // Update the corresponding row in existingItemRows
                            const newRows = existingItemRows.map((row) => {
                                if (row.id === newRow.id) {
                                    return newRow;
                                } else {
                                    return row;
                                }
                            })
                            setExistingItemRows(newRows as ExistingItemTableRowProps[]);
                            return newRow 
                        }}
                        deleteApi={async () => { }}

                        hideFooter={true}
                        showToolbar={false}
                        actionProps={{ editable: true, deletable: false }}
                    />
                </Grid>

                <Grid item xs={12} padding={1}>
                    <Grid container justifyContent="flex-end">
                        {
                            loading ?
                            <CircularProgress /> :
                            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!isReadyToSubmit()}>
                                <Typography variant="body1">
                                    确认
                                </Typography>
                            </Button>
                        }
                        <Button variant="contained" color="secondary" onClick={handleClearAll} disabled={loading}>
                             <Typography variant="body1">
                                清空
                            </Typography>
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </div>
    );
};

export default ExchangeView;