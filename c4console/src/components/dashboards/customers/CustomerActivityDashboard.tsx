import dayjs, { Dayjs } from "dayjs";
import { InvoiceSummary } from "../../../api/Invoices";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Customer } from '../../../api/Customers';
import { useContext, useEffect, useState } from "react";
import { DateRange } from "@mui/x-date-pickers-pro";
import { BackendApiContext } from "../../../api/BackendApiProvider";
import { useApiCall } from "../../hooks/useApiCallWithErrorHandler";

interface CustomerActivityRow {
    id: string;
    customerName: string;
    dailyOrders: number[];
}

const CustomerActivityDashboard = () => {
    // For now we only show the last 3 months
    const currentDate = dayjs();
    const [value, setValue] = useState<DateRange<Dayjs>>([
        currentDate.subtract(90, 'day'),
        currentDate
    ]);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoiceSummaries, setInvoiceSummaries] = useState<InvoiceSummary[]>([]);
    const [rows, setRows] = useState<CustomerActivityRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [rerender, setRerender] = useState(false);

    // 2D map to store the daily number of orders for each customer
    // The outer key is the customer ID, the inner key is the date in the format of "YYYY-MM-DD", the value is the number of orders
    var dataset: Map<string, number[]> = new Map();

    const apiContext = useContext(BackendApiContext);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);

    const fetchData = async () => {
        setLoading(true);

        const startDatetime = value[0]?.startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endDatetime = value[1]?.endOf('day').format('YYYY-MM-DD HH:mm:ss');

        var tempCustomers: Customer[] = [];
        var tempInvoiceSummaries: InvoiceSummary[] = [];
        const promises = [
            queryCustomers({}).then((response) => { 
                    setCustomers(response.customers)
                    tempCustomers = response.customers
                }
            ),
            queryInvoiceSummaries(
                {
                    startDatetime: startDatetime,
                    endDatetime: endDatetime,
                }
            ).then((response) =>  { 
                setInvoiceSummaries(response.invoiceSummaries) 
                tempInvoiceSummaries = response.invoiceSummaries
            })
        ];
        await Promise.all(promises);

        // Set all the values to array of 90 0s
        tempCustomers.forEach((customer) => {
            dataset.set(customer.customerId, Array.from({ length: 90 }, () => 0));
        });

        // Iterate through the invoice summaries
        tempInvoiceSummaries.forEach((summary) => {
            const invoiceDate = dayjs(summary.createDatetime).format('YYYY-MM-DD');

            // If the invoice is not in the range, skip
            if (dayjs(invoiceDate).isBefore(value[0]) || dayjs(invoiceDate).isAfter(value[1])) {
                return;
            }

            // This is the nth day from the start date, 
            const nthDay = dayjs(invoiceDate).diff(value[0], 'day');

            
        });






        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [rerender]);

    const columns: GridColDef[] = [
        {
            field: 'customerName',
            type: 'string',
            flex: 1,
            valueSetter: (params) => {
                params.row.id
            }
        }
    ] 
}

export default CustomerActivityDashboard;