import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef, GridRowEditStopReasons, GridRowModel, GridRowModes, GridRowModesModel, GridRowParams, GridRowsProp, GridSlots, GridSlotsComponentsProps, GridToolbar, GridToolbarContainer } from "@mui/x-data-grid";
import { AuthContext, AuthContextType } from "../auth/AuthProvider";
import { zhCN } from "@mui/x-data-grid/locales";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { GridInitialStatePremium } from "@mui/x-data-grid-premium/models/gridStatePremium";
import { DataGridPremium } from "@mui/x-data-grid-premium";
import CloseIcon from '@mui/icons-material/Close';

interface EditToolbarProps {
    addable: boolean;
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
}

interface ActionProps {
    addable?: boolean;
    editable?: boolean;
    deletable?: boolean;
}

function EditToolbar(
    props: EditToolbarProps,
) {
    const { setRows, setRowModesModel } = props;

    const tempId = Math.floor(Math.random() * 10000)

    const handleClick = () => {
        setRows((oldRows) => [
            ...oldRows, 
            {
                id: tempId,
                isNew: true
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
        {
            props.addable === true ? 
            <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
                <Typography fontSize={14}>
                    新增
                </Typography>
            </Button> : null
        }
        <GridToolbar showQuickFilter />
      </GridToolbarContainer>
    );
}

export interface CustomDataGridProps {
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

    hideFooter?: boolean;
    showToolbar?: boolean;
    actionProps?: ActionProps;

    customSlotAndProps?: {
        slots: Partial<GridSlots>;
        slotProps: GridSlotsComponentsProps;
    };

    dialog?: {
        open: boolean;
        setOpen: Dispatch<SetStateAction<boolean>>;
        row: any;
        setRow: Dispatch<SetStateAction<any>>;
        title: string;
        component: React.ReactNode;
    }

    children?: React.ReactNode;
}


const CustomDataGrid: React.FC<CustomDataGridProps> = (
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

        fetchData,
        
        processRowUpdate,
        deleteApi,

        hideFooter = false,
        showToolbar = true,

        customSlotAndProps,

        actionProps = { addable: true, editable: true, deletable: true },
        
        dialog

    }: CustomDataGridProps
) => {

    const authContext = useContext(AuthContext)

    initialState["pinnedColumns"] = { right: ["actions"] }

    useEffect(() => {
        fetchData().finally(() => {setLoading(false);});
    }, [rerender]);

    const columnsWithActions: GridColDef[] = columns.concat(
        { field: 'actions', type: 'actions', headerName: '操作', width: 100, cellClassName: 'actions', getActions: ( { id }: GridRowParams ) => {
            if (dialog != undefined) {
                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => {
                            dialog.setOpen(true);
                            dialog.setRow(rows.find((row: any) => row.id === id));
                        }}
                        color="inherit"
                    />
                ]
            }

            const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

            if (isInEditMode) {
                if (actionProps.editable) {
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
            } 

            const actionItems: any[] = [];

            if (actionProps.editable === true) {
                actionItems.push(
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => { setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })}}
                        color="inherit"
                    />
                )
            }

            if (actionProps.deletable == true) {
                actionItems.push(
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={
                        async () => {
                            const confirmed = window.confirm('确认删除？');
                            if (!confirmed) {
                                return;
                            }
                            setLoading(true);
                            await deleteApi(id.toString(), authContext);
                            setLoading(false);
                            setRerender(!rerender);
                        }
                        }
                        color="inherit"
                    />
                )
            }
            
            return actionItems
        }}
    ) 

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
                density="compact"
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
                onProcessRowUpdateError={(error) => {
                    console.error(error)
                }}
                loading={loading}
                slots={
                    showToolbar ? 
                    customSlotAndProps?.slots ?? 
                    { toolbar: EditToolbar as GridSlots['toolbar'] } : 
                    undefined
                }
                slotProps={
                    showToolbar ?
                    customSlotAndProps?.slotProps ??
                    {
                        toolbar: { 
                            setRows, 
                            setRowModesModel,
                            addable: actionProps.addable
                         }
                    } : undefined
                }
                pageSizeOptions={[100]}
                hideFooter={hideFooter}

                // Data Grid Premium features
                // cellSelection
                // onBeforeClipboardPasteStart={async () => {
                //     const confirmed = window.confirm('确认粘贴数据？');
                //     if (!confirmed) {
                //         throw new Error('Paste operation cancelled');
                //     }
                // }}
            />
            {
                dialog && 
                <Dialog
                    fullWidth
                    maxWidth='xl'
                    open={dialog.open}
                    onClose={() => { 
                        dialog.setOpen(false);
                        dialog.setRow(undefined);
                    }}
                >
                    <IconButton
                        aria-label="close"
                        onClick={() => dialog.setOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                    <DialogTitle>
                        {dialog.title}
                    </DialogTitle>
                    <DialogContent>
                        {dialog.row && dialog.component}
                    </DialogContent>
                </Dialog>
            }
        </Box>
    );
}

export default CustomDataGrid;