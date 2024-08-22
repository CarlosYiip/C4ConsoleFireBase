import { useContext, useEffect, useState } from "react";
import { Product } from '../../api/Products';
import { Customer } from "../../api/Customers";
import { ReturnItem } from "../../api/Returns";
import { Warehouse } from "../../api/Warehouses";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { zhCN } from '@mui/x-date-pickers/locales';
import { Autocomplete, Box, Button, CircularProgress, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { buildDisplayNameForProduct } from '../../api/utils';
import DeleteIcon from '@mui/icons-material/Delete';
import { Salesperson } from '../../api/Salespersons';

const ReturnPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | undefined>(undefined);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
    const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | undefined>(undefined);
    const [invoiceIds, setInvoiceIds] = useState<string[]>([]);
    const [value, setValue] = useState<Dayjs | null>(dayjs());
    const [loading, setLoading] = useState(false);
    const [overridenTotalAmount, setOverridenTotalAmount] = useState<number | undefined>(undefined);

    const apiContext = useContext(BackendApiContext)

    const { callApi: createReturn } = useApiCall(apiContext.createReturn);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: queryWarehouses } = useApiCall(apiContext.queryWarehouses);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    
    const fetchData = async () => {
        await queryProducts({}).then((response) => {
            setProducts(response.products);
        })

        await queryCustomers({}).then((response) => {
            setCustomers(response.customers);
        })

        await queryWarehouses({}).then((response) => {
            setWarehouses(response.warehouses);
        })

        await querySalespersons({}).then((response) => {
            setSalespersons(response.salespersons);
        })
    }

    useEffect(() => {
        fetchData();
    }, [])

    const selectorMaxWidth = "20%";

    const isReadyForSubmit = () => {
        return (
            returnItems.length > 0 &&
            selectedWarehouse !== undefined &&
            selectedCustomer !== undefined &&
            value !== null
        )
    }

    const handleSubmit = async () => {
        if (selectedCustomer === undefined || selectedWarehouse === undefined || value === null) {
            return;
        }

        // Check for duplicate products, if there are duplicates, display an error message and return
        const productIdSet = new Set<string>();
        for (const returnItem of returnItems) {
            if (productIdSet.has(returnItem.productId)) {
                alert('存在重复产品');
                return;
            }
            productIdSet.add(returnItem.productId);
        }

        setLoading(true);
        await createReturn({
            items: returnItems.map((returnItem) => {
                return {
                    productId: returnItem.productId,
                    quantity: returnItem.quantity,
                    price: returnItem.price,
                    warehouseName: returnItem.warehouseName,
                }
            }),
            customerId: selectedCustomer!.customerId,
            salespersonId: selectedSalesperson?.salespersonId,
            overridenCreateDatetime: value?.format('YYYY-MM-DD HH:mm:ss'),
            overridenTotalAmount: overridenTotalAmount
        }).then(() => {
            handleClearItems();
        }).finally(() => {
            setLoading(false);
        });
    }

    const handleClearItems = () => {
        setReturnItems([]);
        setSelectedCustomer(undefined);
        setSelectedWarehouse(undefined);
        setSelectedSalesperson(undefined);
        setOverridenTotalAmount(undefined);
        setValue(dayjs());
    }

    const handleAddProduct = () => {
        setReturnItems([...returnItems, { productId: products[0].productId, quantity: 1, price: 0, warehouseName: selectedWarehouse?.warehouseName || '' }]);
        handleOverridenTotalAmountChange();
    }

    const handleDeleteReturnItem = (index: number) => {
        setReturnItems(returnItems.filter((_, i) => i !== index));
    }

    const handleOverridenTotalAmountChange = () => {
        setOverridenTotalAmount(returnItems.reduce((total, returnItem) => total + (returnItem.quantity * returnItem.price), 0));
    }

    return (
        <Paper elevation={3} style={{ width: '90%'}}>
            <Grid container margin={2} spacing={2}>
                <Grid item xs={12} justifyContent="center" display="flex">
                    <Typography variant="h4">
                        退 货 单
                    </Typography>
                </Grid>
                
                <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}>
                        <DateTimePicker
                            label="日期时间"
                            value={value}
                            onChange={(newValue) => setValue(newValue)}
                        />
                    </LocalizationProvider>
                </Grid>

                <Grid item xs={4}>
                    <Box maxWidth={selectorMaxWidth}>
                    <Autocomplete
                        disablePortal
                        style={{ minWidth: '300px' }}
                        value={{ label: selectedWarehouse?.warehouseName || '', id: selectedWarehouse?.warehouseName || '' }}
                        renderInput={(params) => <TextField {...params} label="选择仓库" />}
                        options={
                            warehouses.map((warehouse) => (
                                {label: warehouse.warehouseName, id: warehouse.warehouseName}
                            ))
                        }
                        isOptionEqualToValue={(option, value) =>  option.id === value.id}
                        onChange={(event, option) => { 
                            if (option !== null) {
                                setSelectedWarehouse(
                                    warehouses.find((warehouse) => warehouse.warehouseName === option.id)
                                )
                                setReturnItems(returnItems.map((returnItem) => {
                                    return {
                                        ...returnItem,
                                        warehouseName: option.id
                                    }
                                }
                                ))
                            }
                        }}
                    />
                    </Box>
                </Grid>

                <Grid item xs={4}>
                    <Box maxWidth={selectorMaxWidth}>
                    <Autocomplete
                        disablePortal
                        style={{ minWidth: '300px' }}
                        value={{ label: selectedCustomer?.customerName || '', id: selectedCustomer?.customerId || '' }}
                        renderInput={(params) => <TextField {...params} label="选择客户" />}
                        options={
                            customers.map((customer) => (
                                {label: customer.customerName, id: customer.customerName}
                            ))
                        }
                        isOptionEqualToValue={(option, value) =>  option.id === value.id}
                        onChange={(event, option) => { 
                            if (option !== null) {
                                setSelectedCustomer(
                                    customers.find((customer) => customer.customerName === option.id)
                                )
                            }
                        }}
                    />
                    </Box>
                </Grid>

                <Grid item xs={4}>
                    <Box maxWidth={selectorMaxWidth}>
                    <Autocomplete
                        disablePortal
                        style={{ minWidth: '300px' }}
                        value={{ label: selectedSalesperson?.salespersonName || '', id: selectedSalesperson?.salespersonId || '' }}
                        renderInput={(params) => <TextField {...params} label="选择业务员(可不选)" />}
                        options={
                            salespersons.map((salesperson) => (
                                {label: salesperson.salespersonName, id: salesperson.salespersonId}
                            ))
                        }
                        isOptionEqualToValue={(option, value) =>  option.id === value.id}
                        onChange={(event, option) => { 
                            if (option !== null) {
                                setSelectedSalesperson(salespersons.find((salesperson) => salesperson.salespersonId === option.id))
                            }
                        }}
                    />
                    </Box>
                </Grid>

                <Grid item xs={12} >
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">产品</TableCell>
                                    <TableCell align="left">数量</TableCell>
                                    <TableCell align="left">单价</TableCell>
                                    <TableCell align="left">总价</TableCell>
                                    <TableCell align="left" style={{border: 'none'}}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {returnItems.map((returnItem, index) => (
                                    <TableRow key={index}>
                                        <TableCell align="left">
                                            <Autocomplete
                                                
                                                disablePortal
                                                id="combo-box-demo"
                                                style={{ minWidth: '300px' }}
                                                value={
                                                    { 
                                                        label: buildDisplayNameForProduct(products.find((product) => product.productId == returnItem.productId )),
                                                        id: returnItem.productId 
                                                    }
                                                }
                                                renderInput={(params) => <TextField {...params} label="选择产品" />}
                                                options={
                                                    products.map((product) => (
                                                        {label: buildDisplayNameForProduct(product), id: product.productId}
                                                    ))
                                                }
                                                isOptionEqualToValue={(option, value) =>  option.id === value.id}
                                                onChange={(event, option) => { 
                                                    if (option !== null) {
                                                        const product = products.find((product) => product.productId === option.id)
                                                        if (product !== undefined) {
                                                            returnItems[index].productId = product.productId;
                                                            returnItems[index].quantity = 1;
                                                            returnItems[index].price = 0
                                                            setReturnItems([...returnItems]);
                                                        }
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="left">
                                            <TextField
                                                type="number"
                                                value={returnItem.quantity}
                                                inputProps={{ min: 1,  defaultValue: 1}}
                                                onChange={(event) => {
                                                    const newValue = parseInt(event.target.value);
                                                    if (!isNaN(newValue)) {
                                                        returnItems[index].quantity = newValue;
                                                        setReturnItems([...returnItems]);
                                                    } else {
                                                        returnItems[index].quantity = 1;
                                                        setReturnItems([...returnItems]);
                                                    }
                                                    handleOverridenTotalAmountChange();
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="left">
                                            <TextField
                                                type="number"
                                                value={returnItem.price}
                                                inputProps={{ min: 0 }}
                                                onChange={(event) => {
                                                    const newValue = parseFloat(event.target.value);
                                                    if (!isNaN(newValue)) {
                                                        returnItems[index].price = newValue;
                                                        setReturnItems([...returnItems]);
                                                    } else {
                                                        returnItems[index].price = 0;
                                                        setReturnItems([...returnItems]);
                                                    }
                                                    handleOverridenTotalAmountChange();
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="left">
                                            {returnItem.quantity * returnItem.price}
                                        </TableCell>
                                        <TableCell align="left" style={{ border: 'none' }}>
                                            <IconButton onClick={() => handleDeleteReturnItem(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                <TableRow>
                                    <TableCell align="left" colSpan={3}></TableCell>
                                    <TableCell align="left" style={{ fontWeight: 'bold' }}>
                                        <TextField
                                            type="number"
                                            variant="standard"
                                            value={overridenTotalAmount ?? 0}
                                            inputProps={{ min: 0 }}
                                            onChange={(event) => {
                                                const newValue = parseFloat(event.target.value);
                                                if (!isNaN(newValue)) {
                                                    setOverridenTotalAmount(newValue);
                                                } else {
                                                    setOverridenTotalAmount(undefined);
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="left" style={{ border: 'none' }}></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ borderBottom: 'none' }}>
                                        <IconButton 
                                            onClick={handleAddProduct}
                                            disabled={loading || products.length === 0 }
                                        >
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
                            onClick={handleSubmit} 
                            disabled={loading || !isReadyForSubmit()}
                        >
                            {loading ? <CircularProgress size={24} /> : '确认'}
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleClearItems} disabled={loading} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
                            清空
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default ReturnPage;