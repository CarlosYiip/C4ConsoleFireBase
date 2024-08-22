import { useContext, useEffect, useState } from "react";
import { Warehouse } from "../../api/Warehouses";
import { InventoryItem } from '../../api/InventoryItems';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Product } from "../../api/Products";
import { Autocomplete, Box, Button, CircularProgress, Container, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {lookUpProductDisplayNameByProductId } from "../../api/utils";
import DeleteIcon from '@mui/icons-material/Delete';

const DeductInventoryItemsPage = () => {
    const [rerender, setRerender] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | undefined>(undefined);
    const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
    const [existingInventoryItems, setExistingInventoryItems] = useState<InventoryItem[]>([]);
    const [inventoryItemsToDeduct, setInventoryItemsToDeduct] = useState<InventoryItem[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [notes, setNotes] = useState<string | undefined>(undefined);

    const apiContext = useContext(BackendApiContext)
    const { callApi: queryWarehouses } = useApiCall(apiContext.queryWarehouses);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: queryInventoryItems } = useApiCall(apiContext.queryInventoryItems);
    const { callApi: deductInventoryItems } = useApiCall(apiContext.deductInventoryItems);

    const fetchData = async () => {
        setLoading(true);
        await queryWarehouses({}).then((response) => {
            setWarehousesList(response.warehouses)
        });
        await queryProducts({}).then((response) => {
            setAllProducts(response.products)
        });
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const handleWarehouseChange = async (newWarehouse: Warehouse) => {
        if (newWarehouse !== undefined) {
            setSelectedWarehouse(newWarehouse);
            setLoading(true);
            // Query inventory items for this warehouse
            await queryInventoryItems({ warehouseName: newWarehouse.warehouseName }).then((response) => {
                setExistingInventoryItems(response.inventoryItems);
            }).finally(() => {
                clearAll();
                setLoading(false);
            });
        }
    }

    const handleAddInventoryItem = () => {
        if (selectedWarehouse === undefined) {
            return;
        }

        const newInventoryItem: InventoryItem = {
            warehouseName: selectedWarehouse.warehouseName,
            productId: existingInventoryItems[0].productId,
            quantity: 0
        };

        setInventoryItemsToDeduct([...inventoryItemsToDeduct, newInventoryItem]);
    }

    const handleItemChange = (productId: string, index: number) => {
        if (selectedWarehouse === undefined) {
            return;
        }
        const newInventoryItems = [...inventoryItemsToDeduct];
        newInventoryItems[index].warehouseName = selectedWarehouse.warehouseName;
        newInventoryItems[index].productId = productId;
        newInventoryItems[index].quantity = 1;
        setInventoryItemsToDeduct(newInventoryItems);
    }

    const clearAll = () => {
        setInventoryItemsToDeduct([]);
        setNotes(undefined);
    }

    const hasDuplicateItems = () => {
        const seen = new Set();
        for (let i = 0; i < inventoryItemsToDeduct.length; i++) {
            const item = inventoryItemsToDeduct[i];
            if (seen.has(item.productId)) {
                return true;
            }
            seen.add(item.productId);
        }
        return false;
    }

    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        const newInventoryItems = [...inventoryItemsToDeduct];
        newInventoryItems[index].quantity = parseInt(event.target.value);
        setInventoryItemsToDeduct(newInventoryItems);
    }

    const handleSubmit = async () => {
        if (selectedWarehouse === undefined || inventoryItemsToDeduct.length === 0 || notes === undefined) {
            return;
        }

        setLoading(true);
        const request = {
            items: inventoryItemsToDeduct,
            notes: notes
        };

        await deductInventoryItems(request).finally(() => {setLoading(false);});

        clearAll();
        setSelectedWarehouse(undefined);
        setExistingInventoryItems([]);
        setRerender(!rerender);
    }

    const anyRequestedQuantitylargerThanExisting = () => {
        for (let i = 0; i < inventoryItemsToDeduct.length; i++) {
            const item = inventoryItemsToDeduct[i];
            const existingItem = existingInventoryItems.find((existingItem) => existingItem.productId === item.productId);
            if (existingItem !== undefined && item.quantity > existingItem.quantity) {
                return true;
            }
        }
        return false
    }

    return (
        <Container>
            <Box mt={2}>
            <Paper elevation={3}>
                <Box p={2}>
                    <Typography variant="h4" align="center" style={{ fontSize: '2rem' }}>出  库  单</Typography>
                </Box>
                <Box p={2}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box maxWidth={"20%"}>
                            <Autocomplete
                                disablePortal
                                color="primary"
                                options={warehousesList}
                                isOptionEqualToValue={(option, value) => option.warehouseName === value.warehouseName}
                                getOptionLabel={(option) => option.warehouseName}
                                value={selectedWarehouse}
                                onChange={(e, value) => {
                                    handleWarehouseChange(value as Warehouse);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="选择仓库"
                                        sx={{ minWidth: 200 }}
                                    />
                                )}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            fullWidth
                            label="出库备注"
                            value={notes || ''}
                            onChange={(event) => setNotes(event.target.value)}
                            multiline
                        />
                    </Grid>
                </Grid>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell align="left">产品</TableCell>
                                <TableCell align="left">库存</TableCell>
                                <TableCell align="left">数量</TableCell>
                                <TableCell align="left"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {inventoryItemsToDeduct.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Autocomplete
                                            disablePortal
                                            value={
                                                { 
                                                    label: lookUpProductDisplayNameByProductId(item.productId, allProducts), 
                                                    id: item.productId
                                                }
                                            }
                                            renderInput={(params) => <TextField {...params} label="选择产品" />}
                                            isOptionEqualToValue={
                                                (option, value) => option.id === value.id
                                            }
                                            options={
                                                existingInventoryItems.map((item, index) => {
                                                    return { label: lookUpProductDisplayNameByProductId(item.productId, allProducts), id: item.productId }
                                                })
                                            }
                                            onChange={(event, option) => { 
                                                if (option !== null) { 
                                                    handleItemChange(option.id, index);   
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="left">
                                        {existingInventoryItems.find((existingItem) => existingItem.productId === item.productId)?.quantity}
                                    </TableCell>
                                    <TableCell align="left">
                                        <TextField
                                            type="number"
                                            onChange={
                                                (event) => {
                                                    handleQuantityChange(event, index);
                                                }
                                            }
                                            value={item.quantity.toString().replace('^0.', '')}
                                            inputProps={
                                                { 
                                                    min: 1,
                                                    max: existingInventoryItems.find((existingItem) => existingItem.productId === item.productId)?.quantity
                                                }
                                            }
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            aria-label="delete" 
                                            onClick={() => {
                                                setInventoryItemsToDeduct(inventoryItemsToDeduct.filter((_, i) => i !== index));
                                            }}
                                        >
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
                        onClick={handleSubmit} 
                        disabled={
                            loading || 
                            selectedWarehouse === undefined ||
                            inventoryItemsToDeduct.length === 0 ||
                            inventoryItemsToDeduct.some((item) => item.quantity === 0) ||
                            hasDuplicateItems() ||
                            anyRequestedQuantitylargerThanExisting() ||
                            notes === undefined
                        }
                    >
                        {loading ? <CircularProgress size={24} /> : '确认'}
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={clearAll} disabled={loading} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
                        清空
                    </Button>
                </Box>
            </Paper>
            </Box>
        </Container>
    );
}

export default DeductInventoryItemsPage;