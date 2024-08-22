import { useContext, useState } from "react";
import CustomDataGrid from "../common/CustomDataGrid";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { GridColDef, GridRowModel, GridRowModesModel } from "@mui/x-data-grid";

interface ProductTableRowProps {
    id: string;
    productName: string;
    specification?: string;
    variant?: string;
    price?: number;
}

const PriceTable = () => {
    const [rows, setRows] = useState<ProductTableRowProps[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const apiContext = useContext(BackendApiContext);

    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: updateProduct } = useApiCall(apiContext.updateProduct);

    const fetchData = async () => {
        setLoading(true);
        await queryProducts({}).then((response) => {
            setRows(response.products.map((it) => {
                return {
                    id: it.productId,
                    productName: it.productName,
                    specification: it.specification,
                    variant: it.variant,
                    price: it.price,
                }
            }));
        }).finally(() => {
            setLoading(false);
        });
    }

    const columns: GridColDef[] = [
        { field: 'productName', headerName: '产品名', flex: 1, editable: true},
        { field: 'specification', headerName: '规格', flex: 1, editable: true},
        { field: 'variant', headerName: '版本', flex: 1, editable: true },
        { 
            field: 'price', 
            headerName: '价格', 
            flex: 1, 
            editable: true, 
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            preProcessEditCellProps: (params) => {
                const value = params.props.value;
                // Since the column is a number type, the value will be null if the input is not a number
                const hasError = value === null || value < 0;

                if (hasError) {
                    alert('价格必须是一个大于等于0的数字');
                }

                return {
                    ...params.props, error: hasError
                }
            }
        },
    ]

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        if (newRow.price === oldRow.price) {
            return newRow;
        }
        
        setLoading(true);
        await updateProduct({productId: newRow.id, price: newRow.price}).finally(() => {setLoading(false);});
        return newRow;
    }


    return (
        <CustomDataGrid
            columns={columns}
            initialState={{ 
                sorting: { sortModel: [{field: 'productName', sort: 'asc'}] }
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
            deleteApi={async () => {}}
            actionProps={ { addable: false, editable: true, deletable: false } }
        />
    );
};

export default PriceTable;