import { useContext, useState } from "react";
import { GridColDef, GridRowModel, GridRowModesModel } from "@mui/x-data-grid-premium";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { Salesperson } from '../../api/Salespersons';
import { AuthContext } from "../auth/AuthProvider";
import CustomDataGrid from "../common/CustomDataGrid";

interface SalespersonTableRowProps {
    id: string;
    salespersonName: string;
    contactNumber: string;
    isNew?: boolean;
}

const SalespersonTable = () => {
    const [rows, setRows] = useState<SalespersonTableRowProps[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(false);

    const apiContext = useContext(BackendApiContext)
    const authContext = useContext(AuthContext)

    const fetchData = async () => {
        await apiContext.querySalespersons({}, authContext).then((response) => {
            setRows(response.salespersons.map((salesperson: Salesperson) => {
                return {
                    id: salesperson.salespersonId,
                    salespersonName: salesperson.salespersonName,
                    contactNumber: salesperson.contactNumber
                }
            }));
        });
    }

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'id', width: 200 },
        { field: 'salespersonName', headerName: '姓名', width: 200, editable: true },
        { field: 'contactNumber', headerName: '联系方式', width: 200, editable: true },
    ]

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        setLoading(true);
        if (newRow.isNew) {
            await apiContext.createSalesperson({
                salespersonName: newRow.salespersonName,
                contactNumber: newRow.contactNumber,
            }, authContext);
        } else {
            await apiContext.updateSalesperson({
                salespersonId: newRow.id,
                salespersonName: newRow.salespersonName,
                contactNumber: newRow.contactNumber,
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
                sorting: { sortModel: [{field: 'salespersonName', sort: 'asc'}] }
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
                    await apiContext.deleteSalesperson({salespersonId: id}, authContext)
                }
            }
        >
        </CustomDataGrid>
    );
}

export default SalespersonTable;