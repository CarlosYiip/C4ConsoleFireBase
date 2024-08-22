import { GridColDef, GridRowModel, GridRowModesModel } from "@mui/x-data-grid";
import { useContext, useState } from "react";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { Driver } from "../../api/Drivers";
import CustomDataGrid from "../common/CustomDataGrid";
import { useApiCall } from '../hooks/useApiCallWithErrorHandler';

interface DriverTableRowProps {
    id: string;
    driverName: string;
    isNew?: boolean;
}

const DriverTable = () => {
    const [rows, setRows] = useState<DriverTableRowProps[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(false);

    const apiContext = useContext(BackendApiContext)

    const { callApi: createDriver } = useApiCall(apiContext.createDriver);
    const { callApi: queryDrivers } = useApiCall(apiContext.queryDrivers);
    const { callApi: updateDriver } = useApiCall(apiContext.updateDriver);
    const { callApi: deleteDriver } = useApiCall(apiContext.deleteDriver);

    const fetchData = async () => {
         await queryDrivers({}).then((response) => {
            setRows(response.drivers.map((driver: Driver) => {
                return {
                    id: driver.driverId,
                    driverName: driver.driverName
                    }
                }
            ))
        });
    }

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'id', width: 200 },
        { field: 'driverName', headerName: '姓名', width: 200, editable: true },
    ]

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        setLoading(true);
        if (newRow.isNew) {
            await createDriver({driverName: newRow.driverName}).finally(() => {
                setLoading(false);
                setRerender(!rerender);
            });
        } else {
            await updateDriver({driverId: newRow.id, driverName: newRow.driverName}).finally(() => {
                setLoading(false);
                setRerender(!rerender);
            });
        }
        return newRow;
    }

    return (
        <CustomDataGrid
            columns={columns}
            initialState={{ 
                columns: { columnVisibilityModel: { id: false } },
                sorting: { sortModel: [{field: 'driverName', sort: 'asc'}] }
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
                    await deleteDriver({driverId: id});
                }
            }
        />
    )
}

export default DriverTable;