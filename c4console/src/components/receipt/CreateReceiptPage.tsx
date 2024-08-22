import React, { useContext, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import {Autocomplete, Button, CircularProgress, Container, FormControl, Grid, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { BackendApiContext } from "../../api/BackendApiProvider";
import { ReceiptSummary } from "../../api/Receipts";
import { InvoiceItem, InvoiceSummary } from '../../api/Invoices';
import { Customer } from "../../api/Customers";
import { Product } from '../../api/Products';
import { buildDisplayNameForProduct, convertIdFormat } from '../../api/utils';
import { buildDisplayNameForAccount, PaymentAccount } from '../../api/PaymentAccounts';
import { useApiCall } from "../hooks/useApiCallWithErrorHandler";

const CreateReceiptPage = () => {
    
    // Current receipt
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [deductAmount, setDeductAmount] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [amountDue, setAmountDue] = useState<number | undefined>(undefined);

    // Already created receipts
    const [receiptSummaries, setReceiptSummaries] = useState<ReceiptSummary[]>([]);
    const [deductedTotalAmount, setDeductedTotalAmount] = useState<number>(0);
    const [receivedTotalAmount, setReceivedTotalAmount] = useState<number>(0);
    
    // Invoice details
    const [invoiceId, setInvoiceId] = useState<string | undefined>(undefined);
    const [existingInvoiceIds, setExistingInvoiceIds] = useState<string[]>([]);
    const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | undefined>(undefined);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    
    const [invoicedPrice, setInvoicedPrice] = useState<number>(0);
    const [receivablePrice, setReceivablePrice] = useState<number>(0);

    // Payment accounts
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
    const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<PaymentAccount | undefined>(undefined);
    
    // TODO - Pass override date time value to backend
    const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs(new Date()));
    const [selectedTime, setSelectedTime] = React.useState<Dayjs | null>(dayjs(new Date()));
    
    const [loading, setLoading] = useState<boolean>(false);

    const apiContext = useContext(BackendApiContext);

    const { callApi: queryCustomers } = useApiCall(apiContext.queryCustomers);
    const { callApi: queryPaymentAccounts } = useApiCall(apiContext.queryPaymentAccounts);
    const { callApi: createReceipt } = useApiCall(apiContext.createReceipt);
    const { callApi: queryInvoiceSummaries } = useApiCall(apiContext.queryInvoiceSummaries);
    const { callApi: getInvoice } = useApiCall(apiContext.getInvoice);
    const { callApi: getReceiptsByInvoiceId } = useApiCall(apiContext.getReceiptsByInvoiceId);
    const { callApi: queryProducts } = useApiCall(apiContext.queryProducts);

    useEffect(() => {
        queryCustomers({}).then((response) => {setCustomers(response.customers);});
        queryPaymentAccounts({}).then((response) => {setPaymentAccounts(response.paymentAccounts);});
        queryProducts({}).then((response) => {setProducts(response.products);});
    }, []);

    const handleSubmitReceipt = async () => {
        if (invoiceId === undefined) {
            throw new Error('Required field invoiceId are missing.');
        }

        if (selectedPaymentAccount === undefined) {
            throw new Error('Required field selectedPaymentAccount are missing.');
        }
        
        setLoading(true);
        await createReceipt(
            {
                invoiceId: invoiceId,
                receiptItems: [],
                totalAmount: totalAmount,
                deductAmount: deductAmount,
                paymentAccountId: selectedPaymentAccount?.paymentAccountId ?? '',
                overridenCreateDatetime: selectedDate?.format('YYYY-MM-DD') + ' ' + selectedTime?.format('HH:mm:ss'),
            }
        )
        handleClearItems()
        setLoading(false);
    };

    const handleClearItems = (includeCustomerId: boolean = true,) => {
        // Current receipt
        if (includeCustomerId) {
            setCustomerId(undefined);
        }
        setDeductAmount(0);
        setTotalAmount(0);


        // Already created receipts
        setReceiptSummaries([]);
        setDeductedTotalAmount(0);
        setReceivedTotalAmount(0);
        
        // Invoice details
        setInvoiceId(undefined);
        setInvoiceSummary(undefined);
        setInvoiceItems([]);
        setInvoicedPrice(0);
        setReceivablePrice(0);

        // Payment accounts
        setSelectedPaymentAccount(undefined);
    };

    const handleCustomerIdChange =  async (customerId: string) => {
        setLoading(true)
        setCustomerId(customerId);
        await queryInvoiceSummaries(
            {
                startDatetime: dayjs().subtract(6, 'months').format('YYYY-MM-DD HH:mm:ss'),
                endDatetime: dayjs().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),
                customerId: customerId,
                excludeFullyPaid: true,
                limit: 2000
            }
        ).then(
            (response) => {setExistingInvoiceIds(response.invoiceSummaries.map((it) => it.invoiceId));}
        );
        // Clear
        handleClearItems(false)

        setLoading(false)
    }

    const handleInvoiceIdChange = async (invoiceId: string) => {
        setLoading(true);
        setInvoiceId(invoiceId);

        let receivablePrice = 0;
        let totalReceivedAmount = 0;
        let totalDeductedAmount = 0;
        let invoiceItems: InvoiceItem[] = []
        
        await getInvoice({invoiceId: invoiceId, includeInvoiceItems: true}).then((response) => {
            setInvoiceSummary(response.invoiceSummary);
            setInvoiceItems(response.invoiceItems);
            setInvoicedPrice(response.invoiceSummary.totalAmount)
            setReceivablePrice(response.invoiceSummary.overridenTotalAmount ?? response.invoiceSummary.totalAmount)
            
            receivablePrice = response.invoiceSummary.overridenTotalAmount ?? response.invoiceSummary.totalAmount
            invoiceItems = response.invoiceItems
        });

        await getReceiptsByInvoiceId({invoiceId: invoiceId}).then((response) => {
            setReceiptSummaries(response.receiptSummaries);

            // Calculate received total amount
            response.receiptSummaries.forEach((receiptSummary) => {
                totalReceivedAmount += receiptSummary.totalAmount;
            });
            setReceivedTotalAmount(totalReceivedAmount);
            // Calculate deducted total amount
            response.receiptSummaries.forEach((receiptSummary) => {
                totalDeductedAmount += receiptSummary.deductAmount ?? 0;
            });
            setDeductedTotalAmount(totalDeductedAmount);
        });

        setTotalAmount(receivablePrice - totalReceivedAmount - totalDeductedAmount);
        setAmountDue(receivablePrice - totalReceivedAmount - totalDeductedAmount);
        setLoading(false);
    }

    const selectorMaxWidth = "40%";

    const isSumOfTotalAmountAndDeductAmountGreaterThanAmountDue = () => {
        if (amountDue === undefined) {
            return false;
        } else {
            return totalAmount + deductAmount > amountDue;
        }
    }

    const isReadyToSubmit = (): boolean => {
        if (invoiceId === undefined) {
            return false
        }

        if (totalAmount + deductAmount === 0) {
            return false
        }

        if (selectedPaymentAccount === undefined) {
            return false
        }

        if (amountDue === undefined) {
            return false
        } else {
            if (totalAmount + deductAmount > amountDue) {
                return false
            }
        }

        return true
    }
    
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container>
                <Box mt={2}>
                <Paper elevation={3}>
                    <Box p={2}>
                        <Typography variant="h4" align="center" style={{ fontSize: '2rem' }}>收  款  单</Typography>
                    </Box>
                    <Box p={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Box maxWidth={"50%"}>
                                <Typography variant="h6">付款日期</Typography>
                                <DatePicker
                                    value={selectedDate}
                                    onChange={(newSelectedDate: any) => setSelectedDate(newSelectedDate)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box maxWidth={"50%"}>
                                <Typography variant="h6">付款时间</Typography>
                                <TimePicker
                                    value={selectedTime}
                                    onChange={(newSelectedTime: any) => setSelectedTime(newSelectedTime)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box maxWidth={'20%'}>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        disablePortal
                                        id="combo-box-demo"
                                        style={{ minWidth: '300px' }}
                                        value={{ label: customers.find((customer) => customer.customerId === customerId)?.customerName ?? '', id: customerId ?? ''}}
                                        renderInput={(params) => <TextField {...params} label="客户" />}
                                        options={
                                            customers.map((customer) => (
                                                {label: customer.customerName, id: customer.customerId}
                                            ))
                                        }
                                        isOptionEqualToValue={(option, value) =>  option.id === value.id}
                                        onChange={(event, option) => { 
                                            if (option?.id !== undefined) {
                                                handleCustomerIdChange(option.id)
                                            }
                                        }}
                                    />
                                </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box maxWidth={'20%'}>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        disablePortal
                                        id="combo-box-demo"
                                        style={{ minWidth: '300px' }}
                                        value={{ label: invoiceId != undefined ? convertIdFormat(invoiceId) : '', id: invoiceId ?? ''}}
                                        renderInput={(params) => <TextField {...params} label="订单号" />}
                                        options={
                                            existingInvoiceIds.map((invoiceId) => (
                                                {label: convertIdFormat(invoiceId), id: invoiceId}
                                            ))
                                        }
                                        isOptionEqualToValue={(option, value) =>  option.id === value.id}
                                        onChange={(event, option) => { 
                                            if (option?.id !== undefined) {
                                                handleInvoiceIdChange(option.id)
                                            }
                                        }}
                                        loading={loading}
                                        disabled={customerId === undefined}
                                    />
                                </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={12}></Grid>
                        <Grid item xs={6}>
                            <Typography variant="h6">收款账户</Typography>
                            <Box maxWidth={selectorMaxWidth}>
                                <FormControl fullWidth>
                                    <Select
                                        displayEmpty
                                        value={selectedPaymentAccount === undefined ? '' : selectedPaymentAccount.paymentAccountId}
                                        onChange={(event) => { setSelectedPaymentAccount(paymentAccounts.find((account) => account.paymentAccountId === event.target.value)) }}
                                        placeholder="收款账户"
                                        size="small"
                                        disabled={invoiceId === undefined}
                                    >
                                        {paymentAccounts.map((account) => (
                                            <MenuItem key={account.paymentAccountId} value={account.paymentAccountId}>{buildDisplayNameForAccount(account)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            {/* Add more salesperson details here */}
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="h6">付款金额</Typography>
                            <Box maxWidth={selectorMaxWidth}>
                                <TextField
                                    fullWidth
                                    defaultValue={0}
                                    inputProps={{ min: 0 }}
                                    value={totalAmount.toString().replace('^0*', '')}
                                    onChange={(event) => {setTotalAmount(Number(event.target.value))}}
                                    size="small"
                                    type="number"
                                    helperText={isSumOfTotalAmountAndDeductAmountGreaterThanAmountDue() ? '付款金额与抵扣金额之和不能大于应收金额' : ''}
                                    disabled={invoiceId === undefined}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="h6">抵扣金额</Typography>
                            <Box maxWidth={selectorMaxWidth}>
                                <TextField
                                    fullWidth
                                    defaultValue={0}
                                    inputProps={{ min: 0 }}
                                    value={deductAmount.toString().replace('^0*', '')}
                                    onChange={(event) => {setDeductAmount(Number(event.target.value))}}
                                    size="small"
                                    type="number"
                                    helperText={isSumOfTotalAmountAndDeductAmountGreaterThanAmountDue() ? '付款金额与抵扣金额之和不能大于应收金额' : ''}
                                    disabled={invoiceId === undefined}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">产品</TableCell>
                                    <TableCell align="left">数量</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell align="left">金额</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoiceItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell align="left">{
                                            products.find((it) => {return it.productId == item.productId}) === undefined ? '未知产品' : buildDisplayNameForProduct(products.find((it) => {return it.productId == item.productId})!)
                                        }</TableCell>
                                        <TableCell align="left">{item.quantity}</TableCell>
                                        <TableCell></TableCell>
                                        <TableCell align="left">{item.amount}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={2} align="left" style={{ borderBottom: 'none' }}></TableCell>
                                        <TableCell align="right" style={{ borderBottom: 'none' }}>
                                            <Typography>
                                            开票金额:
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="left" style={{ borderBottom: 'none' }}>
                                            <Typography>
                                                {invoicedPrice}
                                            </Typography>
                                        </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} align="left" style={{ borderBottom: 'none' }}></TableCell>
                                    <TableCell align="right" style={{ borderBottom: 'none' }}>
                                        <Typography>
                                           应收金额:
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="left" style={{ borderBottom: 'none' }}>
                                        <Typography>
                                           {receivablePrice}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} align="left" style={{ borderBottom: 'none' }}></TableCell>
                                    <TableCell align="right" style={{ borderBottom: 'none' }}>
                                        <Typography>
                                            已收金额 + 已抵扣金额:
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="left" style={{ borderBottom: 'none' }}>
                                        <Typography >
                                            {receivedTotalAmount + deductedTotalAmount}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} align="left" style={{ borderBottom: 'none' }}></TableCell>
                                    <TableCell align="right" style={{ borderBottom: 'none' }}>
                                        <Typography>
                                            剩余尾款:
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="left" style={{ borderBottom: 'none' }}>
                                        <Typography >
                                            {amountDue ?? 0}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box p={2} display="flex" justifyContent="flex-end" mt={2} mr={13}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleSubmitReceipt} 
                            disabled={
                                loading || !isReadyToSubmit()
                            }
                        >
                            {loading ? <CircularProgress size={24} /> : '确认'}
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={(event) => { handleClearItems() }} disabled={loading} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
                            清空
                        </Button>
                    </Box>
                </Paper>
                </Box>
            </Container>
        </LocalizationProvider>
    );
};
export default React.memo(CreateReceiptPage);