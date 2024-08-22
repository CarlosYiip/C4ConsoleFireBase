import { useContext, useState } from "react";
import { Customer } from '../../api/Customers';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { GridColDef, GridRenderCellParams, GridRowModel, GridRowModes, GridRowModesModel, GridRowsProp, GridSlots, GridToolbar, GridToolbarContainer } from "@mui/x-data-grid";
import { Product } from "../../api/Products";
import CustomDataGrid from "../common/CustomDataGrid";
import { Autocomplete, Button, Grid, TextField, Typography } from "@mui/material";
import { buildDisplayNameForProduct } from '../../api/utils';
import { QueryCustomerPricingsRequest, QueryCustomerPricingsResponse } from '../../api/CustomerPricings';
import AddIcon from '@mui/icons-material/Add';

interface EditToolbarProps {
    customers: Customer[];
    selectedCustomer: Customer | undefined;
    setSelectedCustomer: (customer: Customer | undefined) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (newModel: (oldModel: GridRowModesModel) => GridRowModesModel) => void;
    queryCustomerPricings: (request: QueryCustomerPricingsRequest) => Promise<QueryCustomerPricingsResponse>;
    products: Product[];
}

function EditToolbar(
    {
        customers,
        selectedCustomer,
        setSelectedCustomer,
        loading,
        setLoading,
        setRows,
        setRowModesModel,
        queryCustomerPricings,
        products
    }: EditToolbarProps,
) {
    const tempId = Math.floor(Math.random() * 10000)

    const handleClick = () => {
        setRows(
            (oldRows) => [
                ...oldRows, 
                {
                    id: tempId,
                    isNew: true
                }
            ]
        )

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
            <Autocomplete
                sx={{ minWidth: 200 }}
                loading={loading}
                disablePortal
                options={
                    customers.map((customer) => {
                        return {
                            label: customer.customerName,
                            id: customer.customerId
                        }
                    })
                }
                value={
                    {
                        label: customers.find((it) => it.customerId === selectedCustomer?.customerId)?.customerName || '',
                        id: selectedCustomer?.customerId || ''

                    }
                }
                onChange={async (event, option) => {
                    if (option != null) {
                        const findCustomer = customers.find((it) => it.customerId === option.id);
                        if (findCustomer === undefined) {
                            return;
                        }
                        setSelectedCustomer(customers.find((it) => it.customerId === option.id));

                        setLoading(true);
                        // Fetch the customer pricings
                        await queryCustomerPricings({ customerId: option.id })
                        .then((response) => {
                            setRows(() => response.customerPricings.map((it) => ({
                                id: `${it.customerId}_${it.productId}`,
                                productId: it.productId,
                                price: it.price,
                                defaultPrice: products.find((p) => p.productId === it.productId)?.price
                            })));
                        })
                        .finally(() => {
                            setLoading(false);
                        });
                    }
                }}
                renderInput={(params) => <TextField {...params} label="选择客户" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            <Button color="primary" startIcon={<AddIcon />} onClick={handleClick} disabled={selectedCustomer === undefined}>
                <Typography fontSize={14}>
                    新增
                </Typography>
            </Button>
            <GridToolbar showQuickFilter />
        </GridToolbarContainer>
    );
}

interface CustomerPricingRow {
    id: string;
    productId: string;
    price: number;
    defaultPrice?: number;
    isNew?: boolean
}

const CustomerPricingTable = () => {
    const [rows, setRows] = useState<CustomerPricingRow[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const apiContext = useContext(BackendApiContext);
    const { callApi: queryCustomerPricings } = useApiCall(apiContext.queryCustomerPricings);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: createCustomerPricing } = useApiCall(apiContext.createCustomerPricing);
    const { callApi: deleteCustomerPricing } = useApiCall(apiContext.deleteCustomerPricing);
    const { callApi: updateCustomerPricing } = useApiCall(apiContext.updateCustomerPricing);

    const fetchData = async () => {
        setLoading(true);
        const promises = [
            queryCustomers({}).then((response) => {
                setCustomers(response.customers);
            }),
            queryProducts({}).then((response) => {
                setProducts(response.products);
            })
        ];

        await Promise.all(promises).finally(() => {
            setLoading(false);
        });
    }

    const columns: GridColDef[] = [
        {
            field: 'productId',
            headerName: '产品',
            flex: 1,
            valueGetter: (value) => {
                return products.find((it) => it.productId === value)?.productName || '';
            },
            renderCell: (params: GridRenderCellParams) => {
                const row = params.row as CustomerPricingRow;
                const product = products.find((it) => it.productId === row.productId);

                if (
                    params.row.isNew === true
                ) {
                    const row = params.row as CustomerPricingRow;
                    const product = products.find((it) => it.productId === row.productId);

                    return (
                        <Autocomplete
                            options={
                                // Only allow selecting products that are not already in the table
                                products.filter((it) => !rows.some((r) => r.productId === it.productId))
                            }
                            getOptionLabel={(option) => buildDisplayNameForProduct(option)}
                            value={product}
                            onChange={(event, newValue) => {
                                const updatedRows = [...rows];
                                const rowIndex = updatedRows.findIndex((r) => r.id === row.id);
                                if (rowIndex !== -1) {

                                    if (newValue?.productId != undefined) {
                                        updatedRows[rowIndex].productId = newValue?.productId || '';
                                        
                                        const findDefaultPrice = products.find((p) => p.productId === newValue?.productId)?.price;
    
                                        if (findDefaultPrice !== undefined) {
                                            updatedRows[rowIndex].defaultPrice = products.find((p) => p.productId === newValue?.productId)?.price;
                                        }
                                        setRows(updatedRows);
                                    }

                                }
                            }}
                            renderInput={(params) => <TextField {...params} />}
                            size="small"
                        />
                    );
                
                } else {

                    return buildDisplayNameForProduct(product);
                }
            }
        },
        { 
            field: 'price', 
            headerName: '客户特殊价格', 
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            flex: 1,
            preProcessEditCellProps: (params) => {
                const value = params.props.value;
                // Since the column is a number type, the value will be null if the input is not a number
                const hasError = value === null || value < 0;

                if (hasError) {
                    alert('价格必须是一个大于等于0的数字');
                }

                return {
                    ...params.props, error: hasError
                }
            },
            editable: true,
        },
        {
            field: 'defaultPrice',
            headerName: '默认价格',
            flex: 1,
            type: 'number',
            headerAlign: 'left',
            align: 'left'
        }
    ];

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        if (newRow.price === oldRow.price) {
            return oldRow;
        }
    
        if (selectedCustomer === undefined) {
            alert('请选择一个客户');
            return oldRow;
        }
    
        if (newRow.price === null || newRow.price === undefined || isNaN(newRow.price)) {
            alert('价格必须是一个大于等于0的数字');
            return oldRow;
        }
        
        setLoading(true);
        if (newRow.isNew && newRow.isNew === true) {
            await createCustomerPricing({
                customerId: selectedCustomer!.customerId,
                productId: newRow.productId,
                price: newRow.price
            }).finally(() => {
                setLoading(false);
            });
            newRow.id = `${selectedCustomer!.customerId}_${newRow.productId}`;
            newRow.isNew = false;
        } else {
            await updateCustomerPricing({
                customerId: selectedCustomer!.customerId,
                productId: newRow.productId,
                price: newRow.price
            }).finally(() => {
                setLoading(false);
            });
        }

        setRows((prevRows: CustomerPricingRow[]) => {
            const filteredRows = prevRows.filter(row => row.id !== oldRow.id);
            return [...filteredRows, newRow] as CustomerPricingRow[];
        });

        return newRow;
    }

    const deleteApi = async (id: string) => {
        setLoading(true);
        await deleteCustomerPricing({
            customerId: id.split('_')[0],
            productId: id.split('_')[1]
        }).then(() => {
            setRows(rows.filter((it) => it.id !== id));
        }).finally(() => {
            setLoading(false);
        });
        setRerender(!rerender);
    }

    return (
        <Grid container spacing={2} padding={2}>
            <Grid item xs={12}>
                <CustomDataGrid
                    columns={columns}
                    initialState={{ 
                        sorting: { sortModel: [{field: 'customer', sort: 'asc'}] }
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
                    deleteApi={deleteApi}

                    customSlotAndProps={
                        {
                            slots: { toolbar: EditToolbar as GridSlots['toolbar'] },
                            slotProps: {
                                toolbar: {
                                    customers,
                                    selectedCustomer,
                                    setSelectedCustomer,
                                    loading,
                                    setLoading,
                                    setRows,
                                    setRowModesModel,
                                    queryCustomerPricings,
                                    products
                                }
                            }
                        }
                    }
                />
            </Grid>
        </Grid>
    );
};

export default CustomerPricingTable;