import { useContext, useEffect, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { Autocomplete, Box, Button, CircularProgress, Container, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { buildDisplayNameForProduct } from '../../api/utils';
import { Product } from "../../api/Products";
import { Warehouse } from "../../api/Warehouses";
import { InventoryItem } from "../../api/InventoryItems";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Customer } from "../../api/Customers";

const CreateInventoryItemsPage = () => {
    const [loading, setLoading] = useState<boolean>(false);

    const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
    const [productsList, setProductsList] = useState<Product[]>([]);

    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | undefined>(undefined);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [reason, setReason] = useState<string | undefined>(undefined);
    const [notes, setNotes] = useState<string | undefined>(undefined);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);

    const apiContext = useContext(BackendApiContext)
    const { callApi: queryWarehouses } = useApiCall(apiContext.queryWarehouses);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: createInventoryItems } = useApiCall(apiContext.createInventoryItems);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);

    const reasonsList = [
        '采购',
        '退货',
        '其他'
    ]

    const fetchData = async () => {
        const warehouses = await queryWarehouses({});
        setWarehousesList(warehouses.warehouses);

        const products = await queryProducts({});
        setProductsList(products.products);

        const customers = await queryCustomers({});
        setCustomers(customers.customers);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleClearItems = () => {
        setInventoryItems([]);
        setReason(undefined);
        setSelectedCustomerId(undefined);
        setNotes(undefined);
        setSelectedWarehouse(undefined);
    }

    const handleSubmitInventoryItems = async () => {
        if (selectedWarehouse === undefined || inventoryItems.length === 0 || reason === undefined) {
            return;
        }

        if (reason === '其他' && notes === undefined) {
            return;
        }

        if (reason === '退货' && selectedCustomerId === undefined) {
            return;
        }

        setLoading(true);
        await createInventoryItems({items: inventoryItems, notes: notes});
        handleClearItems();
        setLoading(false);
    };
    

    const handleAddInventoryItem = () => {
        if (selectedWarehouse != undefined) {
            setInventoryItems(
                [
                    ...inventoryItems, 
                    { 
                        productId: productsList[0].productId, 
                        quantity: 1, 
                        warehouseName: selectedWarehouse.warehouseName
                    }
                ]
            );
        }
    };


    const handleDeleteInventoryItem = (index: number) => {
        setInventoryItems(inventoryItems.filter((_, i) => i !== index));
    };

    const handleSelectWarhouse = (event: SelectChangeEvent<string>) => {
        const foundWarehouse = warehousesList.find((warehouse) => warehouse.warehouseName === event.target.value);
        if (foundWarehouse != undefined) {
            setSelectedWarehouse(foundWarehouse);
            inventoryItems.forEach((item) => {
                item.warehouseName = event.target.value
            })
        }
    }

    const handleInventoryItemChange = (newProductId: string , index: number) => {
        const newInventoryItems = [...inventoryItems];

        // Do not allow duplicate products
        if (newInventoryItems.map((it) => it.productId).includes(newProductId)) {
            return;
        }

        newInventoryItems[index].productId = newProductId
        setInventoryItems(newInventoryItems);
    };

    const handleInventoryItemQuantityChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        const newInventoryItems = [...inventoryItems];
        newInventoryItems[index].quantity = parseInt(event.target.value);
        setInventoryItems(newInventoryItems);
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container>
                <Box mt={2}>
                <Paper elevation={3}>
                    <Box p={2}>
                        <Typography variant="h4" align="center" style={{ fontSize: '2rem' }}>入  库  单</Typography>
                    </Box>
                    <Box p={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box maxWidth={"20%"}>
                            <FormControl fullWidth>
                                <InputLabel id="warehouse-select-label">选择仓库</InputLabel>
                                <Select
                                    labelId="warehouse-select-label"
                                    id="warehouse-select"
                                    value={selectedWarehouse?.warehouseName || ''}
                                    onChange={handleSelectWarhouse}
                                    label="仓库名"
                                >
                                    {warehousesList.map((warehouse) => (
                                        <MenuItem key={warehouse.warehouseName} value={warehouse.warehouseName}>
                                            {warehouse.warehouseName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box maxWidth={"20%"}>
                            <FormControl fullWidth>
                                <InputLabel id="reason-select-label">选择原因</InputLabel>
                                <Select
                                    labelId="reason-select-label"
                                    id="reason-select"
                                    value={reason || ''}
                                    onChange={(event) => { 
                                        const selectedReason = event.target.value
                                        if (selectedReason === '其他') {
                                            setNotes(undefined);
                                            setSelectedCustomerId(undefined);
                                        } else if (selectedReason === '退货') {
                                            if (customers.length != 0) {
                                                setSelectedCustomerId(customers[0].customerId);
                                                setNotes(`${customers[0].customerName} 退货`);
                                            }
                                        } else if (selectedReason === '采购') {
                                            setSelectedCustomerId(undefined);
                                            setNotes("采购");
                                        }

                                        setReason(selectedReason)
                                    }}
                                    label="原因"
                                >
                                    {reasonsList.map((reason) => (
                                        <MenuItem key={reason} value={reason}>
                                            {reason}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={10}>
                            {
                                reason === '其他' && 
                                <TextField
                                    disabled={reason !== '其他'}
                                    fullWidth
                                    label="备注"
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                />
                            }
                            {
                                reason === '退货' && 
                                <Box maxWidth={"25%"}>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        disablePortal
                                        id="combo-box-demo"
                                        value={{ label: customers.find((it) => it.customerId === selectedCustomerId)?.customerName || '', id: selectedCustomerId}}
                                        renderInput={(params) => <TextField {...params} label="选择客户" />}
                                        options={
                                            customers.map((customer) => (
                                                {label: customer.customerName, id: customer.customerId}
                                            ))
                                        }
                                        isOptionEqualToValue={(option, value) =>  option.id === value.id}
                                        onChange={(event, option) => { 
                                            if (option !== null) {
                                                setSelectedCustomerId(option.id)
                                                setNotes(`${option.label} 退货`)
                                            }
                                        }}
                                    />
                                </FormControl>
                                </Box>
                            }
                        </Grid>
                    </Grid>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>产品</TableCell>
                                    <TableCell align="right">数量</TableCell>
                                    <TableCell align="right"></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {inventoryItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell component="th" scope="row">
                                            <Autocomplete
                                                disablePortal
                                                id="combo-box-demo"
                                                style={{ minWidth: '200px' }}
                                                value={{ label: buildDisplayNameForProduct(
                                                    productsList!.find((it) => it.productId === inventoryItems[index].productId) || productsList[0]
                                                ), id: inventoryItems[index].productId}}
                                                renderInput={(params) => <TextField {...params} label="选择产品" />}
                                                options={productsList.map((product) => ({label: buildDisplayNameForProduct(product), id: product.productId}))}
                                                onChange={(event, option) => { if (option !== null) { handleInventoryItemChange(option.id, index)}}}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                onChange={(event) => handleInventoryItemQuantityChange(event, index)}
                                                value={item.quantity.toString().replace('^0.', '')}
                                                inputProps={ {min: 1} }
                                                sx={{ width: '60%' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton aria-label="delete" onClick={() => handleDeleteInventoryItem(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={3} style={{ borderBottom: 'none' }}>
                                        <IconButton onClick={handleAddInventoryItem} disabled={selectedWarehouse === undefined}>
                                            <AddIcon />
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
                            onClick={handleSubmitInventoryItems} 
                            disabled={
                                loading || 
                                selectedWarehouse === undefined ||
                                inventoryItems.length === 0 || 
                                reason === undefined || 
                                (reason === '其他' && notes === undefined) ||
                                (reason === '退货' && selectedCustomerId === undefined)
                            }
                        >
                            {loading ? <CircularProgress size={24} /> : '确认'}
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleClearItems} disabled={loading} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
                            清空
                        </Button>
                    </Box>
                </Paper>
                </Box>
            </Container>
        </LocalizationProvider>
    )
}

export default CreateInventoryItemsPage