import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef, GridRowEditStopReasons, GridRowModel, GridRowModes, GridRowModesModel, GridRowParams, GridRowsProp, GridSlots, GridToolbarContainer } from "@mui/x-data-grid";
import { AuthContext, AuthContextType } from "../../auth/AuthProvider";
import { zhCN } from "@mui/x-data-grid/locales";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { GridInitialStatePremium } from "@mui/x-data-grid-premium/models/gridStatePremium";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

interface EditToolbarProps {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
}

function EditToolbar(
    props: EditToolbarProps,
) {
    const { setRows, setRowModesModel } = props;

    const tempId = Math.floor(Math.random() * 10000).toString();

    const handleClick = () => {
        setRows((oldRows) => [
            ...oldRows, 
            {
                id: tempId,
            }
        ]);

        setRowModesModel((oldModel) => {
            return {
                ...oldModel,
                [tempId]: {
                    mode: GridRowModes.Edit
                },
            };
        });
    };
  
    return (
      <GridToolbarContainer>
        <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        </Button>
      </GridToolbarContainer>
    );
}

export interface NewInvoiceItemTableRowProps {
    id: string;
    productId?: string;
    productDisplayName?: string;
    quantity?: number;
    price?: number;
    amount?: number;
    originalWarehouseName: string;
    stockLevel?: number;
}

interface NewInvoiceItemsTableProps {
    columns: GridColDef[];
    initialState: GridInitialStatePremium,

    rows: any;
    setRows: Dispatch<SetStateAction<any>>;

    rowModesModel: GridRowModesModel;
    setRowModesModel: Dispatch<SetStateAction<GridRowModesModel>>;

    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;

    rerender: boolean;
    setRerender: Dispatch<SetStateAction<boolean>>;

    fetchData: () => Promise<void>

    processRowUpdate: (newRow: GridRowModel, oldRow: GridRowModel) => Promise<GridRowModel>;
    deleteApi: (id: string, authContext: AuthContextType) => Promise<any>;

    children?: React.ReactNode;
}


const NewInvoiceItemsTable: React.FC<NewInvoiceItemsTableProps> = (
    {
        columns,
        
        initialState,
        
        rows,
        setRows,

        rowModesModel,
        setRowModesModel,
        
        loading,
        setLoading,
        
        rerender,
        setRerender,

        processRowUpdate,
        deleteApi,
        fetchData,
    }: NewInvoiceItemsTableProps
) => {
    const authContext = useContext(AuthContext)

    initialState["pinnedColumns"] = { right: ["actions"] }

    useEffect(() => {
        setLoading(true);
        fetchData();
        setLoading(false);
    }, [rerender]);



    const columnsWithActions: GridColDef[] = columns.concat(
        { field: 'actions', type: 'actions', headerName: '操作', width: 100, cellClassName: 'actions', getActions: ( { id }: GridRowParams ) => {
            const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

            if (isInEditMode) {
                return [
                    <GridActionsCellItem
                        icon={<SaveIcon />}
                        label="Save"
                        sx={{
                        color: 'primary.main',
                        }}
                        onClick={
                            () => {
                                setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
                            }
                        }
                    />,
                    <GridActionsCellItem
                        icon={<CancelIcon />}
                        label="Cancel"
                        className="textPrimary"
                        onClick={
                            () => {
                                setRowModesModel({
                                    ...rowModesModel,
                                    [id]: { mode: GridRowModes.View, ignoreModifications: true },
                                });
                        
                                const editedRow = rows.find((row: any) => row.id === id);
                                if (editedRow!.isNew) {
                                    setRows(rows.filter((row: any) => row.id !== id));
                                }
                                setRerender(!rerender);
                            }
                        }
                        color="inherit"
                    />,
                ];
            } 

            const actionItems: any[] = [];


            actionItems.push(
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    className="textPrimary"
                    onClick={() => { setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })}}
                    color="inherit"
                />
            )


            actionItems.push(
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={
                    async () => {
                        await deleteApi(id.toString(), authContext);
                    }
                    }
                    color="inherit"
                />
            )

            
            return actionItems
        }});

    return (
        <Box
            sx={{
            minHeight: '30vh',
            width: '100%',
            '& .actions': {
                color: 'text.secondary',
            },
            '& .textPrimary': {
                color: 'text.primary',
            },
            }}
        >
            <DataGrid
                autoHeight
                rows={rows}
                columns={columnsWithActions}
                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                initialState={initialState}
                rowSelection={false}
                rowModesModel={rowModesModel}
                onRowModesModelChange={(newRowModesModel: GridRowModesModel) => { setRowModesModel(newRowModesModel);}}
                onRowEditStop={(params, event) => { if (params.reason === GridRowEditStopReasons.rowFocusOut) { event.defaultMuiPrevented = true; }}}
                onCellEditStart={
                    (params, event) => {
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
                }
                onCellEditStop={(params, event) => {event.defaultMuiPrevented = true;}}
                processRowUpdate={processRowUpdate}
                loading={loading}
                slots={
                    {toolbar: EditToolbar as GridSlots['toolbar'] }
                }
                slotProps={
                    {toolbar: { setRows, setRowModesModel }}
                }
                pageSizeOptions={[100]}
                hideFooter
            />
        </Box>
    )
}

export default NewInvoiceItemsTable;