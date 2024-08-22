import { useContext, useEffect, useState } from "react";
import { BackendApiContext } from "../../../api/BackendApiProvider";
import { useApiCall } from "../../hooks/useApiCallWithErrorHandler";
import dayjs from "dayjs";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FormControl, MenuItem, Select, Typography } from "@mui/material";
import { zhCN } from "@mui/x-data-grid/locales/zhCN";

interface RowProps {
    id: string;
    customerName: string;
    assignedSalespersonName: string;
    lastOrderDate: string;
    daysSinceLastOrder: number;
}

const PLACE_HOLDER_VALUE_FOR_NO_ORDER = 999;

const NoOrderCustomerTable = () => {
    const initalPastNDays = 15;
    const pastNDaysDatasetSize = 180;
    const [pastNDays, setPastNDays] = useState(initalPastNDays);
    const [rows, setRows] = useState<RowProps[]>([]);
    const [loading, setLoading] = useState(false);
    const [rerender, setRerender] = useState(false);

    const apiContext = useContext(BackendApiContext);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);

    const fetchData = async () => {
        setLoading(true);

        const currentDate = dayjs();
        const startDatetime = currentDate.subtract(pastNDays, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endDatetime = currentDate.endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const customers = (await queryCustomers({})).customers;
        const invoiceSummaries = (await queryInvoiceSummaries({
            startDatetime: startDatetime,
            endDatetime: endDatetime,
        })).invoiceSummaries;
        const salespersons = (await querySalespersons({})).salespersons;

        // We need a find a larger dataset for finding out the customer's last order date
        const allInvoiceSummariesInThePast180Days = (await queryInvoiceSummaries({
            startDatetime: currentDate.subtract(pastNDaysDatasetSize, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
            endDatetime: currentDate.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        })).invoiceSummaries;

        // Find out the customers who have not placed any orders in the past N days
        const customerIdsWithOrders = new Set();
        invoiceSummaries.forEach((summary) => {
            customerIdsWithOrders.add(summary.customerId);
        });

        const noOrderCustomers = customers.filter((customer) => !customerIdsWithOrders.has(customer.customerId));

        // Build the map of the last order date for the customers that have not placed any orders in the past N days
        const lastOrderDateMap = new Map<string, string>();

        allInvoiceSummariesInThePast180Days
            .filter((summary) => noOrderCustomers.find((customer) => customer.customerId === summary.customerId))
            .forEach((summary) => {
                const customerId = summary.customerId;
                const date = dayjs(summary.createDatetime);
                
                if (lastOrderDateMap.has(customerId)) {
                    const lastOrderDate = dayjs(lastOrderDateMap.get(customerId)!);
                    if (date.isAfter(lastOrderDate)) {
                        lastOrderDateMap.set(customerId, date.format('YYYY-MM-DD'));
                    }
                } else {
                    lastOrderDateMap.set(customerId, date.format('YYYY-MM-DD'));
                }
            });

        // Set the rows
        setRows(noOrderCustomers.map((customer) => ({
            id: customer.customerId,
            customerName: customer.customerName,
            assignedSalespersonName: salespersons.find((salesperson) => salesperson.salespersonId === customer.assignedSalespersonId)?.salespersonName || '',
            lastOrderDate: lastOrderDateMap.get(customer.customerId) || '',
            daysSinceLastOrder: lastOrderDateMap.has(customer.customerId) ? currentDate.diff(dayjs(lastOrderDateMap.get(customer.customerId)), 'day') : PLACE_HOLDER_VALUE_FOR_NO_ORDER
        })));

        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const columns: GridColDef[] = [
        { field: 'customerName', headerName: '客户', flex: 1 },
        { field: 'assignedSalespersonName', headerName: '业务员', flex: 1 },
        { field: 'lastOrderDate', headerName: '上次下单日期', flex: 1 },
        { 
            field: 'daysSinceLastOrder', 
            headerName: '距上次下单天数', 
            flex: 1,
            valueFormatter: (value) => {
                if (value === PLACE_HOLDER_VALUE_FOR_NO_ORDER) {
                    return '超过180天';
                }

                return `${value} 天`
            }
         },
    ];

    return (
        <div>
            <Typography variant="h6" paddingTop={2}>
                {pastNDays} 天内未下单的客户 ({rows.length} 位) ({dayjs().subtract(pastNDays, 'day').format('YYYY-MM-DD')} 至 {dayjs().format('YYYY-MM-DD')})
            </Typography>
            <FormControl>
                <Select
                        labelId="past-n-days-label"
                        id="past-n-days-select"
                        value={pastNDays}
                        onChange={(event) => {
                            setPastNDays(event.target.value as number);
                            setRerender(!rerender);
                        }}
                    >
                    <MenuItem value={15}>15 天</MenuItem>
                    <MenuItem value={30}>30 天</MenuItem>
                    <MenuItem value={90}>90 天</MenuItem>
                </Select>
            </FormControl>
            
            <DataGrid
                initialState={{
                    sorting: { 
                        sortModel: [
                            {
                                field: 'daysSinceLastOrder',
                                sort: 'asc'
                            }
                        ]
                    },
                }}
                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                disableRowSelectionOnClick
                rows={rows}
                columns={columns}
                loading={loading}
                density="compact"
                autoHeight
                pageSizeOptions={[50, 100]}
            />
        </div>
    );
}

export default NoOrderCustomerTable;