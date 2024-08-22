import { useContext, useEffect, useState } from "react";
import { GridColDef, GridRowModel, GridRowModesModel, GridSlots, GridToolbar, GridToolbarContainer } from "@mui/x-data-grid-premium";
import { Autocomplete, TextField } from "@mui/material";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { AuthContextType } from '../auth/AuthProvider';
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Warehouse } from "../../api/Warehouses";
import CustomDataGrid from "../common/CustomDataGrid";
import { Product } from "../../api/Products";
import { buildDisplayNameForProduct } from "../../api/utils";

interface EditToolbarProps {
    warehouses: Warehouse[];
    selectedWarehouse: Warehouse | undefined;
    setSelectedWarehouse: (warehouse: Warehouse | undefined) => void;
}

function EditToolbar(
    props: EditToolbarProps,
) {
    return (
      <GridToolbarContainer>
            <Autocomplete
                disablePortal
                color="primary"
                value={props.selectedWarehouse}
                onChange={(event, newValue) => {
                    props.setSelectedWarehouse(newValue as Warehouse);
                }}
                options={props.warehouses}
                getOptionLabel={(option) => option.warehouseName}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="选择仓库"
                        sx={{ minWidth: 200 }}
                    />
                )}
                sx={{ marginBlock: 1 }}
            />

        <GridToolbar showQuickFilter />
      </GridToolbarContainer>
    );
}

interface InventoryItemRow {
    id: string;
    productName: string;
    brand?: string;
    type?: string;
    quantity: number;
    lastUpdatedDatetime?: string;
}

const InventoryTable = () => {
    const [rows, setRows] = useState<InventoryItemRow[]>([]);
    const [rowsModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | undefined>(undefined);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [rerender, setRerender] = useState(false);

    const apiContext = useContext(BackendApiContext);
    const { callApi: queryInventoryItems } = useApiCall(apiContext.queryInventoryItems)
    const { callApi: queryWarehouses } = useApiCall(apiContext.queryWarehouses)
    const { callApi: updateInventoryItem } = useApiCall(apiContext.updateInventoryItem)
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts)

    const fetchData = async () => {
        setLoading(true);
        queryWarehouses({}).then((response) => { setWarehouses(response.warehouses); })
        queryProducts({}).then((response) => { setProducts(response.products); })
    }

    const fetchInventory = async () => {
        if (selectedWarehouse === undefined || selectedWarehouse === null) {
            return;
        }
        setLoading(true);
        queryInventoryItems({ warehouseName: selectedWarehouse.warehouseName }).then((response) => {
            setRows(response.inventoryItems.map((item) => {
                const product = products.find((product) => product.productId === item.productId);
                return {
                    id: item.productId,
                    productName: product ? buildDisplayNameForProduct(product) : '未知产品',
                    brand: product?.brand,
                    type: product?.type,
                    quantity: item.quantity,
                    lastUpdatedDatetime: item.lastUpdatedDatetime
                }
            }));
        }).finally(() => {
            setLoading(false);
        });
    }

    useEffect(() => {
        fetchInventory();
    }, [selectedWarehouse, rerender]);

    const columns: GridColDef[] = [
        { field: 'productName', headerName: '产品', flex: 0.8 },
        { field: 'brand', headerName: '品牌', flex: 0.5 },
        { field: 'variant', headerName: '版本', flex: 0.5},
        { field: 'type', headerName: '类别', flex: 0.5},
        { field: 'lastUpdatedDatetime', headerName: '上次调整', flex: 0.5 },
        { 
            field: 'quantity', 
            headerName: '数量', flex: 0.5, editable: true, type: 'number', align: 'left', headerAlign: 'left', 
            valueSetter: (value, row) => {
                if (value < 0) {
                    return row;
                }

                return { ...row, quantity: value };
            }
        }
    ]

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        if (selectedWarehouse != undefined) {
            setLoading(true);
            await updateInventoryItem(
                {warehouseName: selectedWarehouse?.warehouseName, productId: newRow.id, quantity: newRow.quantity}
            ).finally(() => {
                setLoading(false);
            });

            setRerender(!rerender);
        }
        return newRow;
    }

    const deleteRow = async (id: string, authContext: AuthContextType) => {
        // Does not allow delete for now
    }

    return (
        <div style={{ height: '80vh', width: '80vw', marginLeft:30, marginTop: 20 }}>
            <CustomDataGrid
                columns={columns}
                initialState={{ 
                    columns: { columnVisibilityModel: { id: false } },
                    sorting: { sortModel: [{field: 'productName', sort: 'desc'}] }
                }}

                rows={rows}
                setRows={setRows}
                
                rowModesModel={rowsModesModel}
                setRowModesModel={setRowModesModel}

                loading={loading}
                setLoading={setLoading}

                rerender={rerender}
                setRerender={setRerender}

                fetchData={fetchData}

                processRowUpdate={processRowUpdate}
                deleteApi={deleteRow}

                showToolbar={true}
                customSlotAndProps={
                    {
                        slots: { toolbar: EditToolbar as GridSlots['toolbar'] },
                        slotProps: { 
                            toolbar: { 
                                warehouses,
                                selectedWarehouse,
                                setSelectedWarehouse
                            }
                        } 
                    }
                }
                actionProps={{ editable: true, deletable: false }}
            />
        </div>
    );
}

export default InventoryTable