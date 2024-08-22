import { useContext, useState } from "react";
import { GridColDef, GridRowModesModel } from "@mui/x-data-grid-premium";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { Warehouse } from "../../api/Warehouses";
import { AuthContext } from "../auth/AuthProvider";
import CustomDataGrid from "../common/CustomDataGrid";

interface WarehouseTableRowProps {
    id: string;
    warehouseName: string;
    address: string;
    isNew?: boolean;
}

const WarehouseTable = () => {
    const [rows, setRows] = useState<WarehouseTableRowProps[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(false);

    const apiContext = useContext(BackendApiContext);
    const authContext = useContext(AuthContext);

    const fetchData = async () => {
        await apiContext.queryWarehouses({}, authContext).then((response) => {
            setRows(response.warehouses.map((warehouse: Warehouse) => {
                return {
                    id: warehouse.warehouseName,
                    warehouseName: warehouse.warehouseName,
                    address: warehouse.address
                }
            }));
        });
    }

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'id', width: 200 },
        { field: 'warehouseName', headerName: '仓库名', width: 200, editable: false },
        { field: 'address', headerName: '地址', width: 200, editable: true },
    ]

    const processRowUpdate = async (newRow: any, oldRow: any) => {
        setLoading(true);
        if (newRow.isNew) {
            await apiContext.createWarehouse({
                warehouseName: newRow.warehouseName,
                address: newRow.address,
            }, authContext);
        } else {
            await apiContext.updateWarehouse({
                warehouseName: newRow.warehouseName,
                address: newRow.address,
            }, authContext);
        }
        setLoading(false);
        setRerender(!rerender);
        return newRow;
    }


    return (
        <CustomDataGrid
            columns={columns}
            initialState={{ 
                columns: { columnVisibilityModel: { id: false } },
                sorting: { sortModel: [{field: 'warehouseName', sort: 'asc'}] }
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
                async (id: string, authContext) => {
                    // Disallow deletion of warehouses for now
                    // await apiContext.deleteWarehouse({warehouseName: id}, authContext)
                }
            }
        >
        </CustomDataGrid>
    );
}

export default WarehouseTable;