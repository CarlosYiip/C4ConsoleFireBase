import { Autocomplete, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from "@mui/material";
import { Customer } from '../../../api/Customers';
import { Salesperson } from "../../../api/Salespersons";
import { useContext, useState } from "react";
import { BackendApiContext } from "../../../api/BackendApiProvider";
import { useApiCall } from "../../hooks/useApiCallWithErrorHandler";

interface AutocompleteProps {
    selectedCustomerId: string | undefined;
    setSelectedCustomerId: (customerId: string) => void;
    setSelectedSalespersonId: (salespersonId: string) => void;
    customers: Customer[];
    salespersons: Salesperson[];
    setQuickCreatedCustomer: (customer: Customer) => void;
}

const ID_FOR_ADD_NEW = "ADD"

const CustomerAutocomplete = ({
    selectedCustomerId, 
    setSelectedCustomerId, 
    setSelectedSalespersonId,
    customers,
    salespersons,
    setQuickCreatedCustomer
}: AutocompleteProps) => {
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState<string | undefined>(undefined);
    const [newCustomerContactNumber, setNewCustomerContactNumber] = useState<string | undefined>(undefined);
    const [newCustomerType, setNewCustomerType] = useState<string | undefined>(undefined);
    const [newCustomerAssignedSalespersonId, setNewCustomerAssignedSalespersonId] = useState<string | undefined>(undefined);
    const [newCustomerAddress, setNewCustomerAddress] = useState<string | undefined>(undefined);

    const apiContext = useContext(BackendApiContext);

    const { callApi: createCustomer } = useApiCall(apiContext.createCustomer);
    const { callApi: assignCustomerToSalesperson } = useApiCall(apiContext.assignCustomerToSalesperson);

    const handleCustomerChange = async (newCustomerId: string | undefined) => {
        if (newCustomerId === undefined) {
            return;
        }

        setLoading(true)
        setSelectedCustomerId(newCustomerId)

        const findAssignedSalesperson = customers.find((customer) => customer.customerId === newCustomerId)?.assignedSalespersonId
        if (findAssignedSalesperson !== undefined) {
            setSelectedSalespersonId(findAssignedSalesperson)
        }

        setLoading(false)
    }

    const handleClose = () => {
        setOpenDialog(false);
        clearAll();
    }

    const clearAll = () => {
        setNewCustomerAddress(undefined);
        setNewCustomerAssignedSalespersonId(undefined);
        setNewCustomerContactNumber(undefined);
        setNewCustomerName(undefined);
        setNewCustomerType(undefined);
    }

    const handleSubmit = async () => {
        if (newCustomerName === undefined || 
            newCustomerAssignedSalespersonId === undefined ||
            newCustomerContactNumber === undefined || 
            newCustomerAddress === undefined || 
            newCustomerType === undefined) {
            return;
        }

        setLoading(true)

        await createCustomer({
            customerName: newCustomerName,
            contactNumber: newCustomerContactNumber,
            customerType: newCustomerType,
            address: newCustomerAddress,
        }).then(async (response) => {

            setQuickCreatedCustomer({
                customerId: response.customerId,
                customerName: newCustomerName,
                contactNumber: newCustomerContactNumber,
                customerType: newCustomerType,
                address: newCustomerAddress,
                assignedSalespersonId: newCustomerAssignedSalespersonId
            })

            await assignCustomerToSalesperson({
                customerId: response.customerId,
                salespersonId: newCustomerAssignedSalespersonId
            })
        }).finally(() => {
            setLoading(false)
            setOpenDialog(false)
            clearAll()
        })
    }

    return (
        <div>
            <Autocomplete
                disablePortal
                id="combo-box-demo"
                style={{ minWidth: '300px' }}
                value={
                    { 
                        inputValue: "",
                        label: customers.find(customer => customer.customerId === selectedCustomerId)?.customerName || "", 
                        id: selectedCustomerId 
                    }
                }
                renderInput={(params) => <TextField {...params} label="选择客户" />}
                options={
                    customers.map((customer) => (
                        {
                            inputValue: "",
                            label: customer.customerName, 
                            id: customer.customerId
                        }
                    ))
                }
                isOptionEqualToValue={(option, value) =>  option.id === value.id}
                onChange={(event, option) => { 
                    if (option !== null) {
                        if (option.id === ID_FOR_ADD_NEW) {
                            setOpenDialog(true);
                            setNewCustomerName(option.inputValue)
                        } else {
                            handleCustomerChange(option.id)
                        }
                    }
                }}

                filterOptions={(options, params) => {
                    const filtered = options.filter((option) => {
                        if (option.label.includes(params.inputValue)) {
                            return true;
                        }
                    })

                    const hasExactMatch = options.some((option) => option.label === params.inputValue);

                    if (params.inputValue.trim().length != 0 && !hasExactMatch) {
                        filtered.push(
                            {
                                inputValue: params.inputValue,
                                label: `新增客户: "${params.inputValue}"`, 
                                id: ID_FOR_ADD_NEW
                            }
                        )
                    }
        
                    return filtered;
                }}
            />

            <Dialog 
                open={openDialog} 
                onClose={() => {}}
                fullWidth
                maxWidth='xl'
            >
                <DialogTitle>
                    快速新增客户
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} marginBlock={2}>
                        <Grid item xs={6}>
                            <TextField
                                margin="dense"
                                id="name"
                                value={newCustomerName}
                                onChange={(event) => {
                                    setNewCustomerName(event.target.value)
                                }}
                                label="客户名"
                                type="text"
                                variant="standard"
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <Autocomplete
                                disablePortal
                                id="combo-box-demo"
                                value={
                                    { 
                                        label: salespersons.find((it) => it.salespersonId === newCustomerAssignedSalespersonId)?.salespersonName || "",
                                        id: newCustomerAssignedSalespersonId || ''
                                    }
                                }
                                renderInput={
                                    (params) => 
                                    <TextField 
                                        {...params} 
                                        autoFocus
                                        label="选择分配业务员(必选)" 
                                        variant="standard"
                                        type="text"
                                        margin="dense"
                                    />
                                }
                                options={
                                    salespersons.map((salesperson) => (
                                        {label: salesperson.salespersonName, id: salesperson.salespersonId}
                                    ))
                                }
                                isOptionEqualToValue={(option, value) =>  option.id === value.id}
                                onChange={(event, option) => { 
                                    if (option !== null) {
                                        setNewCustomerAssignedSalespersonId(option.id)
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                margin="dense"
                                id="type"
                                value={newCustomerType}
                                onChange={(event) => {
                                    setNewCustomerType(event.target.value)
                                }}
                                label="客户类型"
                                type="text"
                                variant="standard"
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                margin="dense"
                                id="contactNumber"
                                value={newCustomerContactNumber}
                                onChange={(event) => {
                                    setNewCustomerContactNumber(event.target.value)
                                }}
                                label="联系电话"
                                type="text"
                                variant="standard"
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                margin="dense"
                                id="address"
                                value={newCustomerAddress}
                                onChange={(event) => {
                                    setNewCustomerAddress(event.target.value)
                                }}
                                label="地址"
                                type="text"
                                variant="standard"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleSubmit} 
                        color="primary" 
                        variant="contained"
                        disabled={
                            newCustomerName === undefined ||
                            newCustomerAssignedSalespersonId === undefined ||
                            newCustomerContactNumber === undefined ||
                            newCustomerAddress === undefined || 
                            newCustomerType === undefined
                        }
                    >
                        {loading ? <CircularProgress size={24} /> : '确认'}
                    </Button>
                    <Button 
                        onClick={handleClose}
                        color="secondary"
                        variant="contained"
                    >
                        <Typography>取消</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    )
}

export default CustomerAutocomplete;