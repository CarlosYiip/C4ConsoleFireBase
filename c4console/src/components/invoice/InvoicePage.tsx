import React, { useContext, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Autocomplete, Button, CircularProgress, Dialog, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputAdornment, MenuItem, Paper, Select, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { BackendApiContext } from '../../api/BackendApiProvider';
import { buildDisplayNameForProduct, lookUpProductDisplayNameByProductId } from '../../api/utils';
import { Salesperson } from '../../api/Salespersons';
import { AuthContext } from "../auth/AuthProvider";
import { Customer } from '../../api/Customers';
import { DueDateOption, Invoice, InvoiceItem, SettlementType } from '../../api/Invoices';
import { Product } from "../../api/Products";
import { InventoryItem } from "../../api/InventoryItems";
import { Warehouse } from "../../api/Warehouses";
import InvoicePrintPage from "./InvoicePrintPage";
import CloseIcon from '@mui/icons-material/Close';
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Driver } from "../../api/Drivers";
import { matchSorter } from "match-sorter";
import CustomerAutocomplete from "./autocomplete/CustomerAutocomplete";

const InvoicePage = () => {
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);
    const [salespersonId, setSalespersonId] = useState<string | undefined>(undefined);
    const [billingClerkName, setBillingClerkName] = useState<string | undefined>(undefined);
    const [shippingClerkName, setShippingClerkName] = useState<string | undefined>(undefined);
    const [warehouse, setWarehouse] = useState<string | undefined>(undefined);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [overridenTotalAmount, setOverridenTotalAmount] = useState<number | undefined>(undefined);
    const [invoiceId, setInvoiceId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [notes, setNotes] = useState<string | undefined>(undefined);

    // TODO - Pass override date time value to backend
    const [selectedDate, setSelectedDate] = React.useState<Dayjs>(dayjs(new Date()));
    const [selectedTime, setSelectedTime] = React.useState<Dayjs>(dayjs(new Date()));
    const [dueDate, setDueDate] = React.useState<Dayjs>(dayjs(new Date()));
    const [dueDateOption, setDueDateOption] = React.useState<DueDateOption>(DueDateOption.NOW);
    const [settlementType, setSettlementType] = useState<number>(SettlementType.CASH_ON_DELIVERY);

    const [customersList, setCustomersLists] = useState<Customer[]>([]);
    const [salespersonsList, setSalespersonsList] = useState<Salesperson[]>([]);
    const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
    const [productsList, setProductsList] = useState<Product[]>([]);
    const [driversList, setDriversList] = useState<Driver[]>([]);

    const [quickCreatedCustomer, setQuickCreatedCustomer] = useState<Customer | undefined>(undefined);

    const apiContext = useContext(BackendApiContext);
    const authContext = useContext(AuthContext);

    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    const { callApi: queryWarehouses } = useApiCall(apiContext.queryWarehouses);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: createInvoice } = useApiCall(apiContext.createInvoice);
    const { callApi: queryDrivers } = useApiCall(apiContext.queryDrivers);

    useEffect(() => {
        queryCustomers({}).then((response) => {setCustomersLists(response.customers);});
        querySalespersons({}).then((response) => {setSalespersonsList(response.salespersons);});
        queryWarehouses({}).then((response) => {setWarehousesList(response.warehouses);});
        queryProducts({}).then((response) => {setProductsList(response.products);});
        queryDrivers({}).then((response) => {setDriversList(response.drivers);});
        // By default, the due date is the same as the invoice date.
        setDueDate(selectedDate)
    }, []);

    useEffect(() => {
        if (quickCreatedCustomer != undefined) {
            queryCustomers({}).then((response) => {setCustomersLists(response.customers);});

            setCustomerId(quickCreatedCustomer.customerId);
            setSalespersonId(quickCreatedCustomer.assignedSalespersonId);

            setQuickCreatedCustomer(undefined);
        }
    }, [quickCreatedCustomer]);

    const lookUpProductPrice = (productId: string) => {
        return productsList.find((it) => it.productId === productId)?.price || 0;
    }

    const lookUpDisplayName = (productId: string) => {
        const item = inventoryItems.find((it) => it.productId === productId)

        if (item === undefined) {
            return '';
        }

        const product = productsList.find((it) => it.productId === productId);


        if (product === undefined) {
            return '未知产品';
        }

        return buildDisplayNameForProduct(product, true, true);
    }

    const handleSubmitInvoice = async () => {
        setLoading(true);

        if (
            customerId === undefined || salespersonId === undefined || warehouse === undefined 
            || dueDate === undefined || billingClerkName === undefined || shippingClerkName === undefined || invoiceItems.length === 0
            || settlementType === undefined
        ) {
            throw new Error('Missing required fields');
        }

        // This is to handle the case where the user selects a due date in the past.
        if (dueDateOption === DueDateOption.NOW) {
            setDueDate(selectedDate);
        }

        const invoice: Invoice = {
            customerId: customerId,
            salespersonId: salespersonId,
            billingClerkName: billingClerkName,
            shippingClerkName: shippingClerkName,
            warehouseName: warehouse,
            items: invoiceItems,
            overridenTotalAmount: overridenTotalAmount,
            overridenCreateDatetime: selectedDate?.format('YYYY-MM-DD') + ' ' + selectedTime?.format('HH:mm:ss'),
            dueDate: dueDate.format('YYYY-MM-DD'),
            notes: notes,
            settlementType: settlementType
        }

        await createInvoice({invoice}).then((response) => {setInvoiceId(response.invoiceId);});

        // Ask user whether needs to print the invoice
        // If yes, open the print preview dialog
        // If no, clear the input fields
        const printInvoice = window.confirm('打印送货单？');
        if (printInvoice) {
            setPrintPreviewOpen(true);
        } else {
            handleClearItems()
        }

        setLoading(false);
    };

    const handleClearItems = () => {
        setInvoiceItems([]);
        setCustomerId(undefined);
        setSalespersonId(undefined);
        setWarehouse(undefined);
        setOverridenTotalAmount(undefined);
        setInventoryItems([]);
        setBillingClerkName(undefined);
        setShippingClerkName(undefined);
    };

    const handleDeleteInvoiceItem = (index: number) => {
        setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    };

    const handleAddProduct = () => {
        setInvoiceItems([
            ...invoiceItems, 
            { 
                productId: productsList[0].productId, 
                displayName: lookUpDisplayName(productsList[0].productId), 
                quantity: 1, 
                price: lookUpProductPrice(productsList[0].productId) 
            }
        ]);
    };

    const lookUpStockLevel = (productId: string) => {
        return inventoryItems.find((it) => it.productId === productId)?.quantity || 0;
    }

    const handleInvoiceItemChange = (newProductId: string , index: number) => {
        const newInvoiceItems = [...invoiceItems];

        newInvoiceItems[index].productId = newProductId
        newInvoiceItems[index].displayName = lookUpDisplayName(newProductId)
        newInvoiceItems[index].quantity = 1
        newInvoiceItems[index].price = lookUpProductPrice(newProductId)
        setInvoiceItems(newInvoiceItems);
    };

    const handleSelectedWarehouse = async (warehouseName: string) => {
        setWarehouse(warehouseName)
        setInvoiceItems([]);
        setLoading(true);
        await apiContext.queryInventoryItems({warehouseName: warehouseName}, authContext).then((response) => {setInventoryItems(response.inventoryItems);});
        setLoading(false);
    }

    const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        if (event.target.value !== '') {
            const newInvoiceItems = [...invoiceItems];
            const overridePrice = parseFloat(event.target.value);
            if (overridePrice >= 0) {
                newInvoiceItems[index].price = overridePrice;
                setInvoiceItems(newInvoiceItems);
            }

        } else if (event.target.value === '') {
            const newInvoiceItems = [...invoiceItems];
            newInvoiceItems[index].price = 0;
            setInvoiceItems(newInvoiceItems);
        }
    }

    const handleInvoiceItemQuantityChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        if (event.target.value !== ''){
            const newInvoiceItems = [...invoiceItems];
            const requestedQuantity = parseInt(event.target.value);
            const stockLevel = lookUpStockLevel(invoiceItems[index].productId);
            var newQuantity;
            if (requestedQuantity >= stockLevel) {
                // Temporarily allow the user to request more than the stock level
                newQuantity = requestedQuantity
            } else if (requestedQuantity < stockLevel && requestedQuantity > 0) {
                newQuantity = requestedQuantity 
            } else {
                newQuantity = 1
            }
            newInvoiceItems[index].quantity = newQuantity;
            setInvoiceItems(newInvoiceItems);
        } else if (event.target.value === '' ){
            const newInvoiceItems = [...invoiceItems];
            invoiceItems[index].quantity = 1;
            setInvoiceItems(newInvoiceItems);
        }
    }

    const handleTotalAmountOverride = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setOverridenTotalAmount(parseFloat(event.target.value));
    }

    const selectorMaxWidth = "20%";

    const isReadyToSubmit = () => {
        // TODO - enable this when we have the stock level check in the backend
        // const enoughStockForEachItem = mergedInvoiceItems.every((item) => item.quantity <= lookUpStockLevel(item.productId));
        const enoughStockForEachItem = true
        
        const noItemsWithZeroQuantity = invoiceItems.every((item) => item.quantity > 0);
        
        return customerId !== undefined && salespersonId !== undefined && warehouse !== undefined && invoiceItems.length !== 0 
        && enoughStockForEachItem && noItemsWithZeroQuantity && billingClerkName !== undefined && shippingClerkName !== undefined
        && settlementType !== undefined;
    }

    const handleDueDateChange = (event: SelectChangeEvent) => {
        if (event.target.value === DueDateOption.NOW) {
            setDueDate(selectedDate)
            setDueDateOption(DueDateOption.NOW)
            setSettlementType(SettlementType.CASH_ON_DELIVERY)
        } else if (event.target.value === "endOfMonth") {
            setDueDate(dayjs().endOf('month'))
            setDueDateOption(DueDateOption.END_OF_MONTH)
            setSettlementType(SettlementType.MONTHLY)
        } else {
            setDueDate(selectedDate)
            setDueDateOption(DueDateOption.CUSTOM)
            setSettlementType(SettlementType.MONTHLY)
        }
    }

    // Invoice print related code
    const [isPrintPreviewOpen, setPrintPreviewOpen] = useState(false);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box display="flex" justifyContent="center" mt={5}>
                <Paper elevation={3} style={{ width: '90%' }} >
                    <Box p={2}>
                        <Typography variant="h4" align="center" style={{ fontSize: '2rem' }}>订  单</Typography>
                    </Box>
                    <Box p={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Box maxWidth={"50%"}>
                                <Typography variant="h6">日期</Typography>
                                <DatePicker
                                    value={selectedDate}
                                    onChange={(newSelectedDate: any) => {
                                        setSelectedDate(newSelectedDate)
                                        if (dueDateOption === DueDateOption.NOW) {
                                            setDueDate(newSelectedDate)
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box maxWidth={"50%"}>
                                <Typography variant="h6">时间</Typography>
                                <TimePicker
                                    value={selectedTime}
                                    onChange={(newSelectedTime: any) => setSelectedTime(newSelectedTime)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box maxWidth={selectorMaxWidth}>
                                <FormControl fullWidth>
                                    <CustomerAutocomplete
                                        selectedCustomerId={customerId}
                                        setSelectedCustomerId={setCustomerId}
                                        setSelectedSalespersonId={setSalespersonId}
                                        customers={customersList}
                                        salespersons={salespersonsList}
                                        setQuickCreatedCustomer={setQuickCreatedCustomer}
                                    />
                                </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box maxWidth={selectorMaxWidth}>
                                <Autocomplete
                                    disablePortal
                                    id="combo-box-demo"
                                    style={{ minWidth: '300px' }}
                                    value={{ label: salespersonsList.find((it) => it.salespersonId === salespersonId)?.salespersonName || '', id: salespersonId || '' }}
                                    renderInput={(params) => <TextField {...params} label="选择业务员" />}
                                    options={
                                        salespersonsList.map((salesperson) => (
                                            {label: salesperson.salespersonName, id: salesperson.salespersonId}
                                        ))
                                    }
                                    isOptionEqualToValue={(option, value) =>  option.id === value.id}
                                    onChange={(event, option) => { 
                                        if (option !== null) {
                                            setSalespersonId(option.id)
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box maxWidth={selectorMaxWidth}>
                                <Autocomplete
                                    disablePortal
                                    id="combo-box-demo"
                                    style={{ minWidth: '300px' }}
                                    value={{ label: warehouse || '', id: warehouse || '' }}
                                    renderInput={(params) => <TextField {...params} label="选择仓库" />}
                                    options={
                                        warehousesList.map((warehouse) => (
                                            {label: warehouse.warehouseName, id: warehouse.warehouseName}
                                        ))
                                    }
                                    isOptionEqualToValue={(option, value) =>  option.id === value.id}
                                    onChange={(event, option) => { 
                                        if (option !== null) {
                                            handleSelectedWarehouse(option.id)
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box maxWidth={selectorMaxWidth}>
                                <FormControl fullWidth>
                                    <Select
                                        displayEmpty
                                        size="small"
                                        value={dueDateOption}
                                        onChange={handleDueDateChange}
                                    >
                                        <MenuItem value={DueDateOption.NOW}>现结</MenuItem>
                                        <MenuItem value={DueDateOption.END_OF_MONTH}>月结</MenuItem>
                                        <MenuItem value={DueDateOption.CUSTOM}>自定义</MenuItem>
                                    </Select>
                                </FormControl>
                                {
                                    dueDateOption === "custom" &&
                                    <DatePicker
                                        value={dueDate}
                                        defaultValue={dueDate}
                                        onChange={(newDueDate: any) => setDueDate(newDueDate)}
                                        sx={{paddingTop: '20px'}}
                                        shouldDisableDate={(date) => { return date.isBefore(selectedDate?.subtract(1, 'days')) }}
                                    />
                                }
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                value={billingClerkName || ''}
                                label="开单员"
                                onChange={(event) => setBillingClerkName(event.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="发货员"
                                value={shippingClerkName || ''}
                                onChange={(event) => setShippingClerkName(event.target.value)}
                            />
                        </Grid>
                        <Grid item xs={10}>
                            <TextField
                                fullWidth
                                label="订单备注"
                                value={notes || ''}
                                onChange={(event) => setNotes(event.target.value)}
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left" style={{ width: '30%' }}>产品</TableCell>
                                    <TableCell align="left">库存</TableCell>
                                    <TableCell align="left">数量</TableCell>
                                    <TableCell align="left">单价</TableCell>
                                    <TableCell align="left" style={{ width: '10%' }}>总价</TableCell>
                                    <TableCell align="left"></TableCell>
                                    <TableCell align="left">单品备注</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoiceItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Autocomplete
                                                disablePortal
                                                id="combo-box-demo"
                                                style={{ minWidth: '200px' }}
                                                value={
                                                    { 
                                                        label: lookUpProductDisplayNameByProductId(invoiceItems[index].productId, productsList), 
                                                        id: invoiceItems[index].productId
                                                    }
                                                }
                                                loading={loading}
                                                renderInput={(params) => <TextField {...params} label="选择产品" />}
                                                options={productsList.map((product) => (
                                                    {label: buildDisplayNameForProduct(product), id: product.productId}
                                                ))}

                                                filterOptions={(options, state) => { 
                                                    return matchSorter(options, state.inputValue, { keys: ['label'] })
                                                }}

                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                onChange={(event, option) => { 
                                                    if (option !== null) {
                                                        handleInvoiceItemChange(option.id, index)
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="left" style={{width: '50px'}}>{invoiceItems[index].productId ? lookUpStockLevel(item.productId) : ''}</TableCell>
                                        <TableCell align="left" style={{width: '150px'}}>
                                            <TextField
                                                type="number"
                                                value={item.quantity.toString().replace('^0.', '')}
                                                inputProps={ {min: 0} }
                                                onChange={(event) => handleInvoiceItemQuantityChange(event, index)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"></InputAdornment>
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="left" style={{width: '150px'}}>
                                            <TextField
                                                type="number"
                                                onChange={(event) => handlePriceChange(event, index)}
                                                value={item.price}
                                                inputProps={ {min: 0} }
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="left" style={{width: '50px'}}>
                                            {item.price * item.quantity}
                                        </TableCell> 
                                        <TableCell align="left" style={{width: '50px'}}>
                                            <IconButton onClick={() => handleDeleteInvoiceItem(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell align="left" style={{minWidth: '200px'}}>
                                            <TextField
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={(event) => {
                                                    const newInvoiceItems = [...invoiceItems];
                                                    newInvoiceItems[index].notes = event.target.value;
                                                    setInvoiceItems(newInvoiceItems);
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={4} align="left" style={{ borderBottom: 'none' }}></TableCell>
                                    <TableCell align="left" style={{ borderBottom: 'none' }}>
                                        <TextField
                                            variant="standard"
                                            value={invoiceItems.reduce((acc, it) => acc + it.price * it.quantity, 0)}
                                            InputProps={{
                                                inputProps: { style: { textAlign: 'left' } },
                                                disableUnderline: true,
                                                style: {
                                                    border: 'none'
                                                }
                                            }}
                                            sx={{ width: '80%' }}
                                            disabled={true}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={3} align="left" style={{ borderBottom: 'none' }}></TableCell>
                                    <TableCell colSpan={3} align="left" style={{ borderBottom: 'none' }}>
                                        <TextField
                                            type="number"
                                            value={overridenTotalAmount || invoiceItems.reduce((acc, it) => acc + it.price * it.quantity, 0)}
                                            inputProps={ {min: 0} }
                                            onChange={(event) => handleTotalAmountOverride(event)}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">¥应收</InputAdornment>,
                                                inputProps: { style: { textAlign: 'left' } }
                                            }}
                                            sx={{ width: '130' }}
                                            disabled={invoiceItems.length === 0}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={3} style={{ borderBottom: 'none' }}>
                                        <IconButton onClick={handleAddProduct} disabled={warehouse === '' || inventoryItems.length === 0 || loading}>
                                            {loading ? <CircularProgress /> : <AddIcon />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box p={2} display="flex" justifyContent="flex-end" mt={2} mr={13}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleSubmitInvoice} 
                            disabled={loading || !isReadyToSubmit()}
                        >
                            {loading ? <CircularProgress size={24} /> : '确认'}
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleClearItems} disabled={loading} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
                            清空
                        </Button>
                    </Box>
                </Paper>
            </Box>

            <Dialog
                open={isPrintPreviewOpen}
                onClose={() => setPrintPreviewOpen(false)}
                fullWidth
                maxWidth="lg"
            >
                <IconButton
                    aria-label="close"
                    onClick={
                        () => { 
                            setPrintPreviewOpen(false)
                            handleClearItems()
                        }
                    }
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon/>
                </IconButton>
                <DialogTitle>预览</DialogTitle>
                <DialogContent>
                    <InvoicePrintPage 
                        invoiceId={invoiceId}
                        invoiceDate={selectedDate.format('YYYY-MM-DD')} 
                        dueDate={dueDate.format('YYYY-MM-DD')}
                        settlementType={settlementType}
                        warehouseName={warehouse ?? ""}
                        customerName={customersList.find((it) => it.customerId === customerId)?.customerName || ""} 
                        customerContactNumber={customersList.find((it) => it.customerId === customerId)?.contactNumber || ""}  
                        salespersonName={salespersonsList.find((it) => it.salespersonId === salespersonId)?.salespersonName || ""}
                        billingClerkName={billingClerkName || ""}
                        shippingClerkName={shippingClerkName || ""}
                        invoiceItems={invoiceItems} 
                        overridenTotalAmount={overridenTotalAmount} 
                        products={productsList}      
                        
                        handleClearItems={handleClearItems}
                        setPrintPreviewOpen={setPrintPreviewOpen}
                    />
                </DialogContent>
                </Dialog>
        </LocalizationProvider>
    );
};

export default React.memo(InvoicePage);
