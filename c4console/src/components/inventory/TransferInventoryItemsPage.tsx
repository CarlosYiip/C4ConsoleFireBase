import { useContext, useEffect, useState } from "react";
import { Warehouse } from "../../api/Warehouses";
import { InventoryItem, transferInventoryItems } from '../../api/InventoryItems';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Product } from "../../api/Products";
import { Autocomplete, Box, Button, CircularProgress, Container, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {lookUpProductDisplayNameByProductId } from "../../api/utils";
import DeleteIcon from '@mui/icons-material/Delete';

const TransferInventoryItemsPage = () => {
    const [rerender, setRerender] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const [selectedFromWarehouse, setSelectedFromWarehouse] = useState<Warehouse | undefined>(undefined);
    const [selectedToWarehouse, setSelectedToWarehouse] = useState<Warehouse | undefined>(undefined);
    
    const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
    const [fromWarehouseInventoryItems, setFromWarehouseInventoryItems] = useState<InventoryItem[]>([]);
    const [toWarehouseInventoryItems, setToWarehouseInventoryItems] = useState<InventoryItem[]>([]);
    const [inventoryItemsToTransfer, setInventoryItemsToTransfer] = useState<InventoryItem[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [notes, setNotes] = useState<string | undefined>(undefined);

    const apiContext = useContext(BackendApiContext)
    const { callApi: queryWarehouses } = useApiCall(apiContext.queryWarehouses);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: queryInventoryItems } = useApiCall(apiContext.queryInventoryItems);
    const { callApi: transferInventoryItems } = useApiCall(apiContext.transferInventoryItems);


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

    const handleFromWarehouseChange = async (newWarehouse: Warehouse) => {
        if (newWarehouse !== undefined) {
            setSelectedFromWarehouse(newWarehouse);
            setLoading(true);
            // Query inventory items for this warehouse
            await queryInventoryItems({ warehouseName: newWarehouse.warehouseName }).then((response) => {
                setFromWarehouseInventoryItems(response.inventoryItems);
            }).finally(() => {
                clearAll();
                setLoading(false);
            });
        }
    }

    const handleToWarehouseChange = async (newWarehouse: Warehouse) => {
        if (newWarehouse !== undefined) {
            setSelectedToWarehouse(newWarehouse);
            setLoading(true);
            // Query inventory items for this warehouse
            await queryInventoryItems({ warehouseName: newWarehouse.warehouseName }).then((response) => {
                setToWarehouseInventoryItems(response.inventoryItems);
            }).finally(() => {
                setLoading(false);
            });
        }
    }

    const handleAddInventoryItem = () => {
        if (selectedFromWarehouse === undefined) {
            return;
        }

        const newInventoryItem: InventoryItem = {
            warehouseName: selectedFromWarehouse.warehouseName,
            productId: fromWarehouseInventoryItems[0].productId,
            quantity: 0
        };

        setInventoryItemsToTransfer([...inventoryItemsToTransfer, newInventoryItem]);
    }

    const handleItemChange = (productId: string, index: number) => {
        if (selectedFromWarehouse === undefined) {
            return;
        }
        const newInventoryItems = [...inventoryItemsToTransfer];
        newInventoryItems[index].warehouseName = selectedFromWarehouse.warehouseName;
        newInventoryItems[index].productId = productId;
        newInventoryItems[index].quantity = 1;
        setInventoryItemsToTransfer(newInventoryItems);
    }

    const clearAll = () => {
        setInventoryItemsToTransfer([]);
        setNotes(undefined);
    }

    const hasDuplicateItems = () => {
        const seen = new Set();
        for (let i = 0; i < inventoryItemsToTransfer.length; i++) {
            const item = inventoryItemsToTransfer[i];
            if (seen.has(item.productId)) {
                return true;
            }
            seen.add(item.productId);
        }
        return false;
    }

    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
        const newInventoryItems = [...inventoryItemsToTransfer];
        newInventoryItems[index].quantity = parseInt(event.target.value);
        setInventoryItemsToTransfer(newInventoryItems);
    }

    const handleSubmit = async () => {
        if (
            selectedFromWarehouse === undefined || 
            selectedToWarehouse === undefined ||
            inventoryItemsToTransfer.length === 0 || 
            notes === undefined) {
            return;
        }

        setLoading(true);
        const request = {
            toWarehouse: selectedToWarehouse.warehouseName,
            items: inventoryItemsToTransfer,
            notes: notes
        };

        await transferInventoryItems(request).finally(() => {setLoading(false);});

        clearAll();
        setSelectedFromWarehouse(undefined);
        setSelectedToWarehouse(undefined);
        setFromWarehouseInventoryItems([]);
        setRerender(!rerender);
    }

    const anyRequestedQuantitylargerThanExisting = () => {
        for (let i = 0; i < inventoryItemsToTransfer.length; i++) {
            const item = inventoryItemsToTransfer[i];
            const existingItem = fromWarehouseInventoryItems.find((existingItem) => existingItem.productId === item.productId);
            if (existingItem !== undefined && item.quantity > existingItem.quantity) {
                return true;
            }
        }
        return false
    }

    const readyForSubmit = () => {
        return (
            selectedFromWarehouse !== undefined &&
            selectedToWarehouse !== undefined &&
            inventoryItemsToTransfer.length > 0 &&
            !hasDuplicateItems() &&
            !anyRequestedQuantitylargerThanExisting() &&
            selectedFromWarehouse !== selectedToWarehouse &&
            notes !== undefined
        );
    }

    return (
        <Container>
            <Box mt={2}>
            <Paper elevation={3}>
                <Box p={2}>
                    <Typography variant="h4" align="center" style={{ fontSize: '2rem' }}>调  货  单</Typography>
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
                                value={selectedFromWarehouse}
                                onChange={(e, value) => {
                                    handleFromWarehouseChange(value as Warehouse);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="选择出库仓库"
                                        sx={{ minWidth: 200 }}
                                    />
                                )}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box maxWidth={"20%"}>
                            <Autocomplete
                                disablePortal
                                color="primary"
                                options={warehousesList}
                                isOptionEqualToValue={(option, value) => option.warehouseName === value.warehouseName}
                                getOptionLabel={(option) => option.warehouseName}
                                value={selectedToWarehouse}
                                onChange={(e, value) => {
                                    handleToWarehouseChange(value as Warehouse);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="选择入库仓库"
                                        sx={{ minWidth: 200 }}
                                    />
                                )}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={10}>
                        <TextField
                            fullWidth
                            label="调货备注"
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
                                <TableCell align="left">出库仓库库存</TableCell>
                                <TableCell align="left">入库仓库库存</TableCell>
                                <TableCell align="left">数量</TableCell>
                                <TableCell align="left"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {inventoryItemsToTransfer.map((item, index) => (
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
                                                fromWarehouseInventoryItems.map((item, index) => {
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
                                        {fromWarehouseInventoryItems.find((existingItem) => existingItem.productId === item.productId)?.quantity}
                                    </TableCell>
                                    <TableCell align="left">
                                        {toWarehouseInventoryItems.find((existingItem) => existingItem.productId === item.productId)?.quantity || 0}
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
                                                    max: fromWarehouseInventoryItems.find((existingItem) => existingItem.productId === item.productId)?.quantity
                                                }
                                            }
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            aria-label="delete" 
                                            onClick={() => {
                                                setInventoryItemsToTransfer(inventoryItemsToTransfer.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell colSpan={3} style={{ borderBottom: 'none' }}>
                                    <IconButton onClick={handleAddInventoryItem} disabled={selectedFromWarehouse === undefined}>
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
                            loading || !readyForSubmit()
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

export default TransferInventoryItemsPage;