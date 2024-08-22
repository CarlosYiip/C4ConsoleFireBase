import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Product } from "../../api/Products";
import { InventoryChangeRecordRow } from "./InventoryChangeRecordsTable";
import { useEffect, useState } from "react";
import { buildDisplayNameForProduct, convertIdFormat } from "../../api/utils";

export interface InventoryChangeRecordDetailsViewProps {
    row?: InventoryChangeRecordRow;
    products: Product[];
}

interface ChangeRecord {
    id: string;
    productName: string;
    currentQuantity?: number;
    previousQuantity?: number;
    transferedQuantity?: number;
    diff?: number;
}

const InventoryChangeRecordDetailsView = (props: InventoryChangeRecordDetailsViewProps) => {
    const [rows, setRows] = useState<ChangeRecord[]>([]);

    var columns: GridColDef[]

    if (props.row?.type === 3) {
        columns = [
            { field: 'productName', headerName: '产品', flex: 1 },
            { field: 'transferedQuantity', headerName: '数量', flex: 0.5 },
        ]
    } else {
        columns = [
            { field: 'productName', headerName: '产品', flex: 2 },
            { field: 'currentQuantity', headerName: '现有数量', flex: 0.5 },
            { field: 'previousQuantity', headerName: '原先数量', flex: 0.5 },
            { 
                field: 'diff', 
                headerName: '变更', 
                flex: 0.5, 
                valueFormatter: (value) => {
                    if (value > 0) {
                        return `+${value}`;
                    } else {
                        return value
                    }
                }
            },
        ]
    }

    useEffect(() => {
        const newRows: ChangeRecord[] = [];
        props.row?.items.forEach((item) => {
            const product = props.products.find((it) => it.productId === item.productId);
            if (product === undefined) {
                console.error(`Product with id ${item.productId} not found`);
                return;
            }

            if (props.row?.type === 3) {
                const newRow: ChangeRecord = {
                    id: product.productId,
                    productName: buildDisplayNameForProduct(product),
                    transferedQuantity: item.transferedQuantity
                }
                newRows.push(newRow);
                return;
            } else {
                if (item.currentQuantity === undefined || item.previousQuantity === undefined) {
                    console.error(`Current quantity or previous quantity is undefined for product with id ${item.productId}`);
                    return;
                }

                const newRow: ChangeRecord = {
                    id: product.productId,
                    productName: buildDisplayNameForProduct(product),
                    currentQuantity: item.currentQuantity,
                    previousQuantity: item.previousQuantity,
                    transferedQuantity: item.transferedQuantity,
                    diff: item.currentQuantity - item.previousQuantity
                }

                newRows.push(newRow);
                return;
            }
        });

        setRows(newRows);
    }, [props.row, props.products])

    return (
        <div>
            <div>
                <div>
                    <div>
                        <label>单号:</label>
                        <span>{props.row?.id != undefined ? convertIdFormat(props.row.id) : ''}</span>
                    </div>
                    <div>
                        <label>类型:</label>
                        <span>{props.row?.type === 0 ? '手动入库' : props.row?.type === 1 ? '手动出库' : props.row?.type === 2 ? '手动更新' : '调货'}</span>
                    </div>
                    {
                        props.row?.type === 0 && 
                        <div>
                            <label>仓库:</label>
                            <span>{props.row.toWarehouse}</span>
                        </div>
                    }
                    {
                        props.row?.type === 1 && 
                        <div>
                            <label>仓库:</label>
                            <span>{props.row.fromWarehouse}</span>
                        </div>
                    }
                    {
                        props.row?.type === 2 && 
                        <div>
                            <label>仓库:</label>
                            <span>{props.row.toWarehouse}</span>
                        </div>
                    }
                    {
                        props.row?.type === 3 && 
                        <div>
                            <div>
                                <label>出库仓库:</label>
                                <span>{props.row?.fromWarehouse}</span>
                            </div>
                            <div>
                                <label>入库仓库:</label>
                                <span>{props.row?.toWarehouse}</span>
                            </div>
                        </div>
                    }
                    <div>
                        <label>日期时间:</label>
                        <span>{props.row?.createdDatetime}</span>
                    </div>
                    <div>
                        <label>备注:</label>
                        <span>{props.row?.notes}</span>
                    </div>
                </div>
                <div>
                    <DataGrid 
                        columns={columns}                    
                        rows={rows}
                        hideFooter
                        autoHeight
                    />
                </div>
            </div>
        </div>
    );
}

export default InventoryChangeRecordDetailsView;