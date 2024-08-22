import { GridColDef, GridRowModel, GridRowModesModel } from "@mui/x-data-grid";
import { useContext, useState } from "react";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Product } from '../../api/Products';
import CustomDataGrid from "../common/CustomDataGrid";
import { convertIdFormat } from "../../api/utils";
import InventoryChangeRecordDetailsView from './InventoryChangeRecordDetailsView';

// This is the largest page size allowed for the MUI data grid community edition
const PAGE_SIZE = 100;

export interface InventoryChangeRecordRow {
    id: string,
    type: number,
    fromWarehouse: string,
    toWarehouse: string,
    items: {
        warehouse: string,
        productId: string,
        currentQuantity?: number,
        previousQuantity?: number,
        transferedQuantity?: number,
    }[],
    createdDatetime: string,
    notes?: string,
}

const InventoryChangeRecordsTable = () => {
    const [rows, setRows] = useState<InventoryChangeRecordRow[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedRow, setSelectedRow] = useState<InventoryChangeRecordRow | undefined>(undefined);
    const [products, setProducts] = useState<Product[]>([]);

    const apiContext = useContext(BackendApiContext);

    const { callApi: queryInventoryChangeRecords} = useApiCall(apiContext.queryInventoryChangeRecords);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);

    const fetchData = async () => {
        setLoading(true);

        var products: Product[] = [];

        await queryProducts({}).then((response) => { 
            products = response.products
            setProducts(products);
        })

        await queryInventoryChangeRecords({}).then((response) => {
            const records = response.records;
            const newRows: InventoryChangeRecordRow[] = [];
            records.forEach((record) => {
                const newRow: InventoryChangeRecordRow = {
                    id: record.recordId,
                    type: record.type,
                    fromWarehouse: record.fromWarehouse,
                    toWarehouse: record.toWarehouse,
                    items: [],
                    notes: record.notes,
                    createdDatetime: record.createdDatetime,
                }
                record.items.forEach((item) => {
                    const product = products.find((product) => product.productId === item.productId);
                    newRow.items.push({
                        warehouse: item.warehouse,
                        productId: item.productId,
                        currentQuantity: item.currentQuantity,
                        previousQuantity: item.previousQuantity,
                        transferedQuantity: item.transferedQuantity,
                    })
                })
                newRows.push(newRow);
            });
            setRows(newRows);
        }).finally(() => {
            setLoading(false);
        });
    }   

    const columns: GridColDef[] = [
        { field: 'id', headerName: "单号", flex: 0.3, valueFormatter: (value) => { return convertIdFormat(value) } },
        { 
            field: 'createdDatetime', headerName: '日期时间', flex: 0.3, type: 'dateTime',
            valueFormatter: (value) => {
                return new Date(value).toLocaleString(
                    "en-US", {
                        timeZone: 'Asia/Shanghai',
                    }
                )
            }
        },
        { 
            field: 'type', headerName: '类型', flex: 0.3,
            valueFormatter: (value) => {
                if (value === 0) {
                    return '入库'
                } else if (value === 1) {
                    return '出库'
                } else if (value == 2) {
                    return '手动更新'
                } else if (value == 3) {
                    return "调货"
                }
            }
        },
        { field: 'fromWarehouse', headerName: '出库仓库', flex: 0.3 },
        { field: 'toWarehouse', headerName: '入库仓库', flex: 0.3 },
        { field: 'notes', headerName: '备注', flex: 0.3 },
    ]

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        return newRow
    }
    const deleteApi = async (id: string) => {
    }

    return (
        <CustomDataGrid
            columns={columns}
            initialState={{ 
                sorting: { sortModel: [{field: 'createdDatetime', sort: 'desc'}] },
                pagination: { paginationModel: { pageSize: PAGE_SIZE } }
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
            deleteApi={deleteApi}

            actionProps={ { addable: false, editable: false, deletable: false } }
            showToolbar={true}

            dialog={
                { 
                    open: openDialog, 
                    setOpen: setOpenDialog, 
                    row: selectedRow, 
                    setRow: setSelectedRow ,
                    title: "库存变更记录明细",
                    component: <InventoryChangeRecordDetailsView row={selectedRow} products={products}/>
                }
            }
        /> 
    )
}

export default InventoryChangeRecordsTable;