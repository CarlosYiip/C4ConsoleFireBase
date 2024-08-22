import { CircularProgress, Grid, Paper, Slider, Typography } from "@mui/material";
import { InvoiceItem, InvoiceSummary } from "../../api/Invoices";
import { useContext, useEffect, useState } from "react";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";
import { Customer } from "../../api/Customers";
import { Salesperson } from "../../api/Salespersons";
import { Product } from "../../api/Products";
import dayjs, { Dayjs } from "dayjs";
import { DateRange } from "@mui/x-date-pickers-pro";
import { getCurrentMonthSalespersonRevenue, calculateDailyOrders, calculateDailyRevenue, calculateNumberOfOrdersForCurrentMonth, calculateNumberOfOrdersForToday, calculateRevenueForCurrentMonth, calculateRevenueForToday, daysXAxis, getCurrentMonthCustomerRevenue, getCurrentMonthCustomerOrders } from "./DataUtils";
import { LineChart } from "@mui/x-charts";
import { BarChart } from '@mui/x-charts/BarChart';
import NoOrderCustomerTable from "./customers/NoOrderCustomerTable";


const ComprehensiveDashboard = () => {
    // current month
    const currentDate = dayjs();
    // At the moment we only get the data from the start of previous month to the end of current month
    const [value, setValue] = useState<DateRange<Dayjs>>([
        currentDate.subtract(1, 'month').startOf('month'),
        currentDate
    ]);

    const [invoiceSummaries, setInvoiceSummaries] = useState<InvoiceSummary[]>([]);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [rerender, setRerender] = useState(false);

    const apiContext = useContext(BackendApiContext);
    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);
    const { callApi: queryInvoiceItems } = useApiCall(apiContext.queryInvoiceItems);
    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: querySalespersons } = useApiCall(apiContext.querySalespersons);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);

    const fetchData = async () => {
        setLoading(true);
        const startDatetime = value[0]?.startOf('day').format('YYYY-MM-DD HH:mm:ss')
        const endDatetime = value[1]?.endOf('day').format('YYYY-MM-DD HH:mm:ss')

        const promises = [
            queryInvoiceSummaries(
                {
                    startDatetime: startDatetime,
                    endDatetime: endDatetime,
                }
            ).then((response) => {setInvoiceSummaries(response.invoiceSummaries)}),
            queryInvoiceItems(
                {
                    startDatetime: startDatetime,
                    endDatetime: endDatetime,
                }
            ).then((response) => {setInvoiceItems(response.invoiceItems)}),
            queryCustomers({}).then((response) => {setCustomers(response.customers)}),
            querySalespersons({}).then((response) => {setSalespersons(response.salespersons)}), 
            queryProducts({}).then((response) => {setProducts(response.products)})
        ];

        await Promise.all(promises).finally(() => {
            setLoading(false);
        })
    }

    useEffect(() => {
        fetchData()
    }, [rerender])

    const currentMonthSalespersonRevenueDataset = getCurrentMonthSalespersonRevenue(invoiceSummaries, salespersons, currentDate);
    
    const [topNCustomersByRevenue, setTopNCustomersByRevenue] = useState<number>(20);
    const currentMonthCustomerRevenueDataSet = getCurrentMonthCustomerRevenue(invoiceSummaries, customers, currentDate);

    const [topNCustomersByOrders, setTopNCustomersByOrders] = useState<number>(20);
    const currentMonthCustomerOrdersDataSet = getCurrentMonthCustomerOrders(invoiceSummaries, customers, currentDate);


    return (
        <Grid container spacing={2} padding={2}>
            {loading ? (
                <Grid item xs={12} display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress size={24}/>
                </Grid>
            ) : (
                <>
                    <Grid item xs={6}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <Typography variant="h6">
                                今日营业额 ({currentDate.format('YYYY-MM-DD')})
                            </Typography>
                            <Typography variant="h4" color="primary">
                                ￥{calculateRevenueForToday(invoiceSummaries, currentDate)}
                            </Typography>
                            
                            <Typography variant="h6" paddingTop={2}>
                                本月营业额 ({currentDate.format('YYYY-MM')})
                            </Typography>
                            <Typography variant="h4" color="primary">
                                ￥{calculateRevenueForCurrentMonth(invoiceSummaries, currentDate)}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <Typography variant="h6">
                                今日订单数 ({currentDate.format('YYYY-MM-DD')})
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {calculateNumberOfOrdersForToday(invoiceSummaries, currentDate)}
                            </Typography>
                            
                            <Typography variant="h6" paddingTop={2}>
                                本月订单数 ({currentDate.format('YYYY-MM')})
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {calculateNumberOfOrdersForCurrentMonth(invoiceSummaries, currentDate)}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <Typography variant="h6" paddingTop={2}>
                                本月每日营业额 ({currentDate.format('YYYY-MM')})
                            </Typography>
                            <LineChart
                                loading={loading}
                                xAxis={
                                    [
                                        { 
                                            data: daysXAxis(currentDate), label: '日期' ,
                                            valueFormatter: (value) => `${value}日`,
                                        }
                                    ]
                                }
                                series={
                                    [{ data: calculateDailyRevenue(invoiceSummaries, currentDate), label: '营业额' }]
                                }
                                width={800}
                                height={400}
                                sx={{paddingLeft: 3, touchAction: 'none'}}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <Typography variant="h6" paddingTop={2}>
                                本月每日订单数 ({currentDate.format('YYYY-MM')})
                            </Typography>
                            <LineChart
                                xAxis={
                                    [
                                        { 
                                            data: daysXAxis(currentDate), label: '日期' ,
                                            valueFormatter: (value) => `${value}日`
                                        }
                                    ]
                                }
                                series={
                                    [{ data: calculateDailyOrders(invoiceSummaries, currentDate), label: '订单数' }]
                                }
                                width={800}
                                height={400}
                                sx={{paddingLeft: 3, touchAction: 'none'}}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <Typography variant="h6" paddingTop={2}>
                                业务员销售额 ({currentDate.format('YYYY-MM')})
                            </Typography>
                            <BarChart
                                layout="horizontal"
                                dataset={currentMonthSalespersonRevenueDataset}
                                yAxis={
                                    [
                                        {
                                            scaleType: 'band',
                                            dataKey: 'salespersonName',
                                        }
                                    ]
                                }
                                series={
                                    [
                                        {
                                            dataKey: 'revenue',
                                            label: '销售额'
                                        }
                                    ]
                                }
                                barLabel={(item, context) => {
                                    if (item.value === 0) {
                                        return ``;
                                    }
                                    return `￥${item.value}`;
                                }}
                                bottomAxis={null}
                                width={1000}
                                height={500}
                                sx={{paddingLeft: 10, touchAction: 'none'}}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <Typography variant="h6" paddingTop={2}>
                                客户销售额 ({currentDate.format('YYYY-MM')})
                            </Typography>
                            <BarChart
                                layout="horizontal"
                                dataset={currentMonthCustomerRevenueDataSet.slice(0, topNCustomersByRevenue)}
                                yAxis={
                                    [
                                        {
                                            scaleType: 'band',
                                            dataKey: 'customerName',
                                        }
                                    ]
                                }
                                series={
                                    [
                                        {
                                            dataKey: 'revenue',
                                            label: '销售额'
                                        }
                                    ]
                                }
                                barLabel={(item, context) => {
                                    if (item.value === 0) {
                                        return ``;
                                    }
                                    return `￥${item.value}`;
                                }}
                                bottomAxis={null}
                                width={1000}
                                height={500}
                                sx={{paddingLeft: 10, touchAction: 'none'}}
                            />
                            <Slider
                                marks
                                value={topNCustomersByRevenue}
                                onChange={(event, value) => setTopNCustomersByRevenue(value as number)}
                                min={1}
                                max={
                                    currentMonthCustomerRevenueDataSet.length > 100 ? 100 : currentMonthCustomerRevenueDataSet.length
                                }
                                step={1}
                                valueLabelDisplay="on"
                                valueLabelFormat={(value) => `前${value}客户`}
                                sx={{padding: 3, width: 800}}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <Typography variant="h6" paddingTop={2}>
                                客户订单数 ({currentDate.format('YYYY-MM')})
                            </Typography>
                            <BarChart
                                layout="horizontal"
                                dataset={currentMonthCustomerOrdersDataSet.slice(0, topNCustomersByOrders)}
                                yAxis={
                                    [
                                        {
                                            scaleType: 'band',
                                            dataKey: 'customerName',
                                        }
                                    ]
                                }
                                series={
                                    [
                                        {
                                            dataKey: 'orders',
                                            label: '订单数',
                                        }
                                    ]
                                }
                                barLabel={(item, context) => {
                                    if (item.value === 0) {
                                        return ``;
                                    }
                                    return `${item.value}单`;
                                }}
                                bottomAxis={null}
                                width={1000}
                                height={500}
                                sx={{paddingLeft: 10, touchAction: 'none'}}
                            />
                            <Slider
                                marks
                                value={topNCustomersByOrders}
                                onChange={(event, value) => setTopNCustomersByOrders(value as number)}
                                min={1}
                                max={
                                    currentMonthCustomerOrdersDataSet.length > 100 ? 100 : currentMonthCustomerOrdersDataSet.length
                                }
                                step={1}
                                valueLabelDisplay="on"
                                valueLabelFormat={(value) => `前${value}客户`}
                                sx={{padding: 3, width: 800}}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{padding: 2, overflow: 'auto'}}>
                            <NoOrderCustomerTable/>
                        </Paper>
                    </Grid>
                </>
            )}
        </Grid>
    )
}

export default ComprehensiveDashboard;