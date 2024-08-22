import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import React from 'react';
import { BackendApiContext } from '../../api/BackendApiProvider';
import { Customer } from '../../api/Customers';
import { convertIdFormat } from '../../api/utils';
import { zhCN } from '@mui/x-data-grid/locales';
import { PaymentAccount, buildDisplayNameForAccount } from '../../api/PaymentAccounts';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGridPremium } from '@mui/x-data-grid-premium';
import { useApiCall } from '../hooks/useApiCallWithErrorHandler';
import { InvoiceSummary } from '../../api/Invoices';

interface ReceiptsTableProps {
    id: string,
    invoiceId: string,
    totalAmount: number,
    deductAmount?: number,
    createDatetime: string,
    customerId: string,
    paymentAccountId: string,
}

const ReceiptsTable = () => {
    const [loading, setLoading] = useState(true);
    const [rerender, setRerender] = useState(false);
    const [rows, setRows] = useState<ReceiptsTableProps[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);

    const apiContext = useContext(BackendApiContext);

    const { callApi: queryReceipts } = useApiCall(apiContext.queryReceipts);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: queryPaymentAccounts } = useApiCall(apiContext.queryPaymentAccounts);

    const fetchData = async () => {
        setLoading(true);
        
        const promises = ([
            queryReceipts({
                startDatetime: dayjs().subtract(1, 'month').format(),
                endDatetime: dayjs().format()
            }).then((response) => {
                setRows(response.receiptSummaries.map((it) => {
                    return {
                        id: it.receiptId,
                        invoiceId: it.invoiceId,
                        totalAmount: it.totalAmount,
                        deductAmount: it.deductAmount,
                        createDatetime: it.createDatetime,
                        customerId: it.customerId,
                        paymentAccountId: it.paymentAccountId
                    };
                }));
            }),
            queryCustomers({}).then((response) => {
                setCustomers(response.customers);
            }),
            queryPaymentAccounts({}).then((response) => {
                setPaymentAccounts(response.paymentAccounts);
            })
        ]);

        await Promise.all(promises);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const columns: GridColDef[] = [
        { 
            field: 'invoiceId', 
            headerName: '订单号', 
            flex: 1,
            valueGetter: (value: string) => {
                return convertIdFormat(value);
            }
        },
        { field: 'createDatetime', headerName: '日期时间', flex: 1 },
        { 
            field: 'id', 
            headerName: '收款单号', 
            flex: 0.5,
            valueGetter: (value: string) => {
                return value.split('_')[1];
            }
        },
        { 
            field: 'customerId', 
            headerName: '客户名', 
            flex: 1,
            valueGetter: (value: string) => {
                return customers.find((it) => it.customerId === value)?.customerName;
            }
        },
        { 
            field: 'totalAmount',
            headerName: '付款金额', 
            flex: 0.5,
            type: 'number',
            headerAlign: 'left',
            align: 'left',

        },
        { 
            field: 'deductAmount', 
            headerName: '抵扣金额', 
            flex: 0.5,
            type: 'number',
            headerAlign: 'left',
            align: 'left',
        },
        { 
            field: 'sum', 
            headerName: '总金额', 
            flex: 0.5,
            type: 'number',
            headerAlign: 'left',
            align: 'left',
            valueGetter: (value, row) => {
                return row.totalAmount + row.deductAmount;
            }
        },
        {
            field: 'paymentAccountId',
            headerName: '付款账户',
            flex: 1,
            valueGetter: (value: string) => {
                const account = paymentAccounts.find((it) => it.paymentAccountId === value)

                if (account) {
                    return buildDisplayNameForAccount(account);
                }

                return "";
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: '操作',
            flex: 0.2,
            getActions: (row: GridRowParams) => {
                return [
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={
                            async () => {
                                const confirmed = window.confirm('确认删除？');
                                if (!confirmed) {
                                    return;
                                }
                                setLoading(true);

                                setLoading(false);
                            }
                        }
                        color="inherit"
                    />,
                ];
            }
        }
    ];

    return (
        <DataGridPremium 
            localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
            rows={rows} 
            loading={loading}
            columns={columns} 
            pageSizeOptions={[1000]}
            checkboxSelection={false}
            disableRowSelectionOnClick={false}
        />
    );
};

export default React.memo(ReceiptsTable);