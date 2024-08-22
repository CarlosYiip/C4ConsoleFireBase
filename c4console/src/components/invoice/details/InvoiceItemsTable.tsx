import { useApiCall } from "../../hooks/useApiCallWithErrorHandler";
import { BackendApiContext } from "../../../api/BackendApiProvider";
import { GridColDef, GridRowModel, GridRowModesModel } from "@mui/x-data-grid";
import { useContext, useState } from "react";
import { InvoiceItemTableRowProps } from "./InvoiceOverview";
import React from "react";
import CustomDataGrid from "../../common/CustomDataGrid";
import { buildDisplayNameForProduct } from "../../../api/utils";

interface InvoiceItemsTableProps {
    invoiceId: string;
}

const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ( {
    invoiceId
} ) => {

    const [rows, setRows] = useState<InvoiceItemTableRowProps[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(true);

    const apiContext = useContext(BackendApiContext)

    const { callApi: deleteInvoiceItem } = useApiCall(apiContext.deleteInvoiceItem)
    const { callApi: updateInvoiceItem } = useApiCall(apiContext.updateInvoiceItem)
    const { callApi: getInvoice } = useApiCall(apiContext.getInvoice)
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts)

    const align = 'left';

    const columns: GridColDef[] = [
        {
            field: 'product',
            headerName: '产品',
            type: 'string',
            headerAlign: align, 
            align: align,
            flex: 1
        },
        {
            field: 'quantity',
            headerName: '数量',
            type: 'number',
            headerAlign: align, 
            align: align,
            editable: true,
            flex: 1
        },
        {
            field: 'price',
            headerName: '单价',
            type: 'number',
            headerAlign: align, 
            align: align,
            editable: true,
            flex: 1
        },
        {
            field: 'amount',
            headerName: '金额',
            type: 'number',
            headerAlign: align, 
            align: align,
            flex: 1
        },
        {
            field: 'warehouseName',
            headerName: '发货仓库',
            type: 'string',
            headerAlign: align, 
            align: align,
            flex: 0.5
        },
        {
            field: 'notes',
            headerName: '备注',
            type: 'string',
            headerAlign: align, 
            align: align,
            flex: 0.5
        }
    ]

    const fetchData = async () => {
        setLoading(true);

        await queryProducts({}).then(
            async (queryProductsResponse) => {
                await getInvoice({invoiceId: invoiceId, includeInvoiceItems: true}).then(
                    (response) => {
                        const rows = response.invoiceItems.map((invoiceItem, index) => {
                            if (invoiceItem.invoiceItemId === undefined) {
                                throw Error("invoice item id is undefined");
                            }

                            const product = queryProductsResponse.products.find(product => product.productId === invoiceItem.productId);

                            if (product === undefined) {
                                throw Error("product is undefined");
                            }

                            return {
                                id: invoiceItem.invoiceItemId,
                                product: buildDisplayNameForProduct(product),
                                quantity: invoiceItem.quantity,
                                price: invoiceItem.price,
                                amount: invoiceItem.amount || invoiceItem.quantity * invoiceItem.price,
                                warehouseName: invoiceItem.warehouseName ?? response.invoiceSummary.warehouseName,
                                notes: invoiceItem.notes
                            }
                        });
        
                        setRows(rows);
                    }
                )
            }    
        )
        setLoading(false);
    }

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        setLoading(true);

        await updateInvoiceItem({
            invoiceItemId: newRow.id,
            quantity: newRow.quantity,
            price: newRow.price
        }).finally(() => {
            setLoading(false);
        })

        newRow.amount = newRow.price * newRow.quantity
        setRerender(!rerender);
        return newRow;
    };


    return (
        <CustomDataGrid
            columns={columns}

            initialState={{ 
            }}

            rows={rows}
            setRows={setRows}

            rowModesModel={rowModesModel}
            setRowModesModel={setRowModesModel}

            loading={loading}
            setLoading={setLoading}

            rerender={rerender}
            setRerender={setRerender}

            fetchData={fetchData}

            processRowUpdate={processRowUpdate}
            deleteApi={
                async (id: string) => {
                    await deleteInvoiceItem({invoiceItemId: id})
                    setRerender(!rerender)
                }
            }

            showToolbar={false}
        
        />
    );
}

export default React.memo(InvoiceItemsTable);