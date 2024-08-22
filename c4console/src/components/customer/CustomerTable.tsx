import { useContext, useState } from "react";
import { MenuItem, Select } from "@mui/material";
import { GridColDef, GridRowModel, GridRowModes, GridRowModesModel } from "@mui/x-data-grid-premium";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { Salesperson } from '../../api/Salespersons';
import CustomDataGrid from '../common/CustomDataGrid';
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";

interface CustomerTableRowProps extends GridRowModel {
    id: string,
    customerName: string,
    contactNumber: string,
    customerType: string,
    assignedSalespersonId?: string,
    address?: string,
    isNew?: boolean
}

const NO_SALESPERSON_ASSIGNED = "无对接业务员"

const CustomerTable = () => {
    const [rows, setRows] = useState<CustomerTableRowProps[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(true);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);

    const apiContext = useContext(BackendApiContext)
    
    const { callApi: createCustomer } = useApiCall(apiContext.createCustomer);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: updateCustomer } = useApiCall(apiContext.updateCustomer);
    const { callApi: deleteCustomer } = useApiCall(apiContext.deleteCustomer);
    const { callApi: assignCustomerToSalesperson } = useApiCall(apiContext.assignCustomerToSalesperson);
    const { callApi: unassignCustomerFromSalesperson } = useApiCall(apiContext.unassignCustomerFromSalesperson);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);

    const fetchData = async () => {
        setLoading(true);
        await queryCustomers(
            {
                includeAssignedSalesperson: true
            }
        ).then((response) => {
            setRows(response.customers.map((it) => {
                return {
                    id: it.customerId,
                    customerName: it.customerName,
                    contactNumber: it.contactNumber,
                    customerType: it.customerType,
                    assignedSalespersonId: it.assignedSalespersonId,
                    address: it.address
                }
            }));
        }).finally(() => {
            setLoading(false);
        });

        await querySalespersons({}).then(
            (response) => {
                setSalespersons(response.salespersons);
            }
        ).finally(() => {
            setLoading(false);
        });

        setLoading(false);
    }

    const columns: GridColDef[] = [
        { field: 'id', headerName: '识别码', width: 200 },
        { field: 'customerName', headerName: '客户名称', width: 200, editable: true, type: 'string' },
        { field: 'contactNumber', headerName: '联系方式', width: 200, editable: true, type: 'string' },
        { field: 'customerType', headerName: '客户类别', width: 200, editable: true, type: 'string' },
        { field: 'address', headerName: '客户地址', width: 200, editable: true, type: 'string'},
        { 
            field: 'assignedSalespersonName', 
            headerName: '对接业务员', 
            width: 200,
            renderCell: (params: any) => {
                return (
                    <>
                        <Select
                            fullWidth
                            value={params.row.assignedSalespersonId}
                            onChange={(event) => {
                                setRows(rows.map((row) => { return row.id === params.row.id ? { ...row, assignedSalespersonId: event.target.value } : row; }));
                            }}
                            disabled={rowModesModel[params.id]?.mode != GridRowModes.Edit}
                        >
                            {
                                [...salespersons.map((it) => {
                                    return <MenuItem value={it.salespersonId}>{it.salespersonName}</MenuItem>
                                }), <MenuItem value={undefined}>{NO_SALESPERSON_ASSIGNED}</MenuItem>]
                            }
                        </Select>
                    </>
                )
            }
        }
    ]


    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        setLoading(true);
        if (newRow.isNew && newRow.isNew === true) {
            // If this is a new row, create a new customer
            const resopnse = await createCustomer({
                customerName: newRow.customerName,
                contactNumber: newRow.contactNumber,
                customerType: newRow.customerType,
                address: newRow.address
            }).finally(() => {
                setLoading(false);
            });
            
            if (newRow.assignedSalespersonId != undefined) {
                await assignCustomerToSalesperson(
                    {
                        customerId: resopnse.customerId,
                        salespersonId: newRow.assignedSalespersonId
                    }
                ).finally(() => {
                    setLoading(false);
                });
            }
            oldRow.id = resopnse.customerId;
            oldRow.isNew = false;
            newRow.id = resopnse.customerId;
            newRow.isNew = false;
        } else {
            // If this is an existing row, update the customer
            await updateCustomer({
                customerId: newRow.id,
                customerName: newRow.customerName != oldRow.customerName ? newRow.customerName : undefined,
                contactNumber: newRow.contactNumber != oldRow.contactNumber ? newRow.contactNumber : undefined,
                customerType: newRow.customerType != oldRow.customerType ? newRow.customerType : undefined,
                address: newRow.address != oldRow.address ? newRow.address : undefined
            })
            
            if (newRow.assignedSalespersonId != undefined) {
                await assignCustomerToSalesperson(
                    {
                        customerId: newRow.id,
                        salespersonId: newRow.assignedSalespersonId
                    }
                ).finally(() => {
                    setLoading(false);
                })
            } else {
                await unassignCustomerFromSalesperson(
                    {
                        customerId: newRow.id,
                    }
                ).finally(() => {
                    setLoading(false);
                });
            }
        }

        setLoading(false);
        setRerender(!rerender);
        return newRow;
    };

    return (
        <CustomDataGrid
            columns={columns}
            initialState={{ 
                sorting: { sortModel: [{field: 'customerName', sort: 'asc'}] }
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
                    await deleteCustomer({customerId: id})
                }
            }
        >
        </CustomDataGrid>
    );
}

export default CustomerTable;