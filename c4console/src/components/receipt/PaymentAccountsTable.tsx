import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { 
    DataGridPremium, 
    GridActionsCellItem,
    GridColDef, 
    GridEventListener, 
    GridRowEditStopReasons, 
    GridRowId, 
    GridRowModel, 
    GridRowModes, 
    GridRowModesModel, 
    GridRowParams, 
    GridRowsProp, 
    GridSlots, 
    GridToolbarContainer,
} from "@mui/x-data-grid-premium";
import { zhCN } from '@mui/x-data-grid/locales';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { AccountType } from "../../api/PaymentAccounts";
import { Box } from "@mui/material";

interface EditToolbarProps {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
}
  
function EditToolbar(props: EditToolbarProps) {
    const { setRows, setRowModesModel } = props;
  
    const handleClick = () => {
        const id = Math.floor(Math.random() * 10000)
        setRows((oldRows) => [...oldRows, { id, accountName: undefined, accountType: undefined, accountNumber: undefined, isNew: true }]);

        setRowModesModel((oldModel) => {
            return {
                ...oldModel,
                [id]: {
                    mode: GridRowModes.Edit,
                    fieldToFocus: 'accountName',  
                },
            };
        });
    };
  
    return (
      <GridToolbarContainer>
        <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
          新增收款账户
        </Button>
      </GridToolbarContainer>
    );
}

interface PaymentAccountsTableProps extends GridRowModel {
    id: string,
    accountName: string,
    accountType: AccountType,
    accountNumber: string,
    isNew?: boolean
}

const PaymentAccountsTable = () => {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<PaymentAccountsTableProps[]>([]);
    const [rerender, setRerender] = useState(false);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

    const apiContext = useContext(BackendApiContext);
    const authContext = useContext(AuthContext);

    const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
          event.defaultMuiPrevented = true;
        }
    };

    const handleCellEditStart: GridEventListener<'cellEditStart'> = (params, event) => {
        setRowModesModel((oldModel) => {
            return {
                ...oldModel,
                [params.id]: {
                    mode: GridRowModes.Edit,
                    fieldToFocus: params.field,
                },
            };
        })
    }

    const handleCellEditStop: GridEventListener<'cellEditStop'> = (params, event) => {
        event.defaultMuiPrevented = true;
    }

    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };
    
    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };
    
    const handleDeleteClick = (id: GridRowId) => async () => {
        const confirmed = window.confirm('确认删除？');
        if (!confirmed) {
            return;
        }
        setLoading(true);
        await apiContext.deletePaymentAccount({paymentAccountId: id.toString()}, authContext);
        setLoading(false);
        setRerender(!rerender);
    };

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        const editedRow = rows.find((row) => row.id === id);
        if (editedRow!.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const fetchPaymentAccounts = async () => {
        setLoading(true);
        await apiContext.queryPaymentAccounts({}, authContext).then((response) => {
            setRows(response.paymentAccounts.map((it) => {
                return {
                    id: it.paymentAccountId,
                    accountName: it.accountName,
                    accountType: it.accountType,
                    accountNumber: it.accountNumber,
                    isNew: false
                }
            }));
        });
        setLoading(false);
    }

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        setLoading(true);
        if (newRow.isNew && newRow.isNew == true) {
            await apiContext.createPaymentAccount({
                accountName: newRow.accountName,
                accountType: newRow.accountType,
                accountNumber: newRow.accountNumber
            }, authContext)
        } else {
            await apiContext.updatePaymentAccount({
                paymentAccountId: newRow.id.toString(),
                accountName: newRow.accountName,
                accountType: newRow.accountType,
                accountNumber: newRow.accountNumber
            }, authContext)
        }

        setLoading(false);
        setRerender(!rerender);
        return newRow;
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    useEffect(() => {
        fetchPaymentAccounts();
    }, [rerender]);

    const columns: GridColDef[] = [
        { field: 'id', headerName: '', width: 200 },
        { field: 'accountName', headerName: '名称', width: 200, editable: true },
        { field: 'accountNumber', headerName: '账号', width: 200, editable: true },
        {
            field: 'accountType',
            headerName: '类别',
            width: 200,
            editable: true
        },
        { field: 'action', type: 'actions', headerName: '操作', width: 100, cellClassName: 'actions', getActions: ( { id }: GridRowParams ) => {
            const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

            if (isInEditMode) {
                return [
                  <GridActionsCellItem
                    icon={<SaveIcon />}
                    label="Save"
                    sx={{
                      color: 'primary.main',
                    }}
                    onClick={handleSaveClick(id)}
                  />,
                  <GridActionsCellItem
                    icon={<CancelIcon />}
                    label="Cancel"
                    className="textPrimary"
                    onClick={handleCancelClick(id)}
                    color="inherit"
                  />,
                ];
            }

            return [
                <GridActionsCellItem
                  icon={<EditIcon />}
                  label="Edit"
                  className="textPrimary"
                  onClick={handleEditClick(id)}
                  color="inherit"
                />,
                <GridActionsCellItem
                  icon={<DeleteIcon />}
                  label="Delete"
                  onClick={handleDeleteClick(id)}
                  color="inherit"
                />,
            ];
        }}
    ];

    const onBeforeClipboardPasteStart = async () => {
        const confirmed = window.confirm('确认粘贴数据？');
        if (!confirmed) {
            throw new Error('Paste operation cancelled');
        }
    }

    return (
        <Box
            sx={{
            height: '80vh',
            width: '100%',
            '& .actions': {
                color: 'text.secondary',
            },
            '& .textPrimary': {
                color: 'text.primary',
            },
            }}
        >
            <DataGridPremium
                rows={rows}
                columns={columns}
                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                initialState={{ columns: { columnVisibilityModel: { id: false } } }}
                cellSelection
                rowSelection={false}
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                onRowEditStop={handleRowEditStop}
                onCellEditStart={handleCellEditStart}
                onCellEditStop={handleCellEditStop}
                processRowUpdate={processRowUpdate}
                loading={loading}
                slots={{
                    toolbar: EditToolbar as GridSlots['toolbar'],
                }}
                slotProps={{
                    toolbar: { setRows, setRowModesModel },
                }}
                sx={{marginRight: 5}}
                onBeforeClipboardPasteStart={onBeforeClipboardPasteStart}
            />
        </Box>
    );
}

export default PaymentAccountsTable;