import { GridColDef, GridRowModel, GridRowModesModel } from "@mui/x-data-grid-premium";
import { useContext, useEffect, useRef, useState } from "react";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { buildDisplayNameForProduct } from "../../api/utils";
import CustomDataGrid from "../common/CustomDataGrid";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import DuplicateItemsList from "../common/DuplicateItemsList";

interface ProductTableRowProps {
    id: string;
    displayName: string;
    productName: string;
    type?: string;
    specification?: string;
    brand?: string;
    alcoholDegree?: number;
    productionYear?: number;
    volume?: number;
    quantity?: number;
    variant?: string;
    price?: number;
    cost?: number;
    isNew?: boolean;
    lastUpdatedDatetime?: string;
}

const ProductsTable = () => {
    const [rows, setRows] = useState<ProductTableRowProps[]>([]);
    const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
    const [rerender, setRerender] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [similarProducts, setSimilarProducts] = useState<ProductTableRowProps[]>([])
    const apiToPassRef = useRef<() => Promise<any>>(() => Promise.resolve());

    const apiContext = useContext(BackendApiContext);

    const { callApi: callQueryProducts } = useApiCall(apiContext.queryProducts);
    const { callApi: callCreateProduct } = useApiCall(apiContext.createProduct);
    const { callApi: callUpdateProduct } = useApiCall(apiContext.updateProduct);

    const fetchData =  async () => {
        setLoading(true);
        await callQueryProducts({}).then((response) => {
            setRows(response.products.map((it) => {
                return {
                    id: it.productId,
                    displayName: buildDisplayNameForProduct(it),
                    productName: it.productName,
                    type: it.type,
                    specification: it.specification,
                    unit: it.unit,
                    brand: it.brand,
                    variant: it.variant,
                    price: it.price,
                    cost: it.cost,
                    lastUpdatedDatetime: it.lastUpdatedDatetime,
                }
            }));
        }).finally(() => {
            setLoading(false);
        });
    }

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
        setLoading(true);
        // Does not allow empty product name
        if (newRow.productName.length === 0 || newRow.productName === null || newRow.productName === undefined) {
            setLoading(false);
            return oldRow;
        }

        // const similarProducts = findSimilarProducts(rows, newRow);
        // if (similarProducts.length > 0) {
        //     setDialogOpen(true);
        //     setSimilarProducts(similarProducts);
        //     if (newRow.isNew) {
        //         apiToPassRef.current = async () => {
        //             console.log("1");
        //             setLoading(true);
        //             await callCreateProduct({
        //                 productName: newRow.productName,
        //                 productType: newRow.type,
        //                 specification: newRow.specification,
        //                 brand: newRow.brand,
        //                 variant: newRow.variant,
        //                 price: newRow.price,
        //                 cost: newRow.cost,
        //             }).finally(() => {
        //                 setLoading(false);
        //             });
        //         };
        //     } else {
        //         apiToPassRef.current = async () => {
        //             setLoading(true);
        //             await callUpdateProduct({
        //                 productId: newRow.id,
        //                 productName: newRow.productName,
        //                 brand: newRow.brand,
        //                 type: newRow.type,
        //                 specification: newRow.specification,
        //                 variant: newRow.variant,
        //                 price: newRow.price,
        //                 cost: newRow.cost,
        //             }).finally(() => {
        //                 setLoading(false);
        //             })
        //         };
        //     }

        //     return oldRow;
        // }

        if (newRow.isNew) {
            await callCreateProduct({
                productName: newRow.productName,
                productType: newRow.type,
                specification: newRow.specification,
                unit: newRow.unit,
                brand: newRow.brand,
                variant: newRow.variant,
                price: newRow.price,
                cost: newRow.cost,
            }).finally(() => {
                setLoading(false);
            });
        } else {
            await callUpdateProduct({
                productId: newRow.id,
                productName: newRow.productName,
                brand: newRow.brand,
                unit: newRow.unit,
                type: newRow.type,
                specification: newRow.specification,
                variant: newRow.variant,
                price: newRow.price,
                cost: newRow.cost,
            }).finally(() => {
                setLoading(false);
            })
        }
        setRerender(!rerender);
        return newRow;
    }

    const columns: GridColDef[] = [
        { field: 'id', headerName: '识别码', flex: 0.5 },
        { field: 'productName', headerName: '产品名', flex: 1, editable: true},
        { field: 'specification', headerName: '规格', flex: 1, editable: true},
        { field: 'variant', headerName: '版本', flex: 1, editable: true },
        { field: 'brand', headerName: '品牌', flex: 1, editable: true},
        { field: 'type', headerName: '类别', flex: 0.5, editable: true},
        { 
            field: 'unit', 
            headerName: '单位', 
            flex: 0.5,
            editable: true,
            type: 'singleSelect',
            valueOptions: [
                { value: '瓶', label: '瓶' },
                { value: '箱', label: '箱' },
                { value: '盒', label: '盒' },
                { value: '包', label: '包' },
                { value: '件', label: '件' },
                { value: '个', label: '个' },
                { value: '支', label: '支' },
            ]
        },
        { field: 'lastUpdatedDatetime', headerName: '上次更新', width: 200 },
    ]

    return (
        <div>
            <CustomDataGrid
                columns={columns}
                initialState={{ 
                    sorting: { sortModel: [{field: 'productName', sort: 'asc'}] }
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
                    async (id: string, authContext) => {
                        await apiContext.deleteProduct({productId: id}, authContext)
                    }
                }

                actionProps={ { addable: true, editable: true, deletable: true } }
            />
            <DuplicateItemsList 
                items={similarProducts} 
                open={dialogOpen} 
                setOpen={setDialogOpen}
                apiToCall={apiToPassRef.current}
                setLoading={setLoading}
            />
        </div>
    );
}

export default ProductsTable;
