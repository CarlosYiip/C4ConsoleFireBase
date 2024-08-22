import { Button, Grid, Paper, Typography } from "@mui/material";
import { InvoiceItem } from "../../api/Invoices";
import { Product } from '../../api/Products';
import Grid2 from "@mui/material/Unstable_Grid2";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { DataGrid, GridColDef, GridSlotsComponentsProps } from "@mui/x-data-grid";
import { buildDisplayNameForProduct, convertIdFormat } from "../../api/utils";
import { useReactToPrint } from "react-to-print";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import formatRMB from 'format-rmb';

interface InvoicePrintPageProps {
    invoiceId: string;
    invoiceDate: string;
    dueDate: string;
    warehouseName: string;
    customerName: string;
    customerContactNumber: string; 
    salespersonName: string;
    driverName?: string;
    shippingClerkName?: string;
    billingClerkName?: string;
    settlementType?: number;

    invoiceItems: InvoiceItem[];
    overridenTotalAmount?: number;

    products: Product[];
    notes?: string;

    // params related to invoice page only
    handleClearItems?: () => void;
    setPrintPreviewOpen?: (value: boolean) => void;
}

interface PrintPageTableRowProps {
    id: string;
    productDisplayName: string;
    unit: string;
    quantity: string;
    price: string;
    amount: string;
    notes?: string;
}

declare module '@mui/x-data-grid' {
    interface FooterPropsOverrides {
        invoiceItems:  InvoiceItem[];
        overridenTotalAmount: number;
        products: Product[];
    }
}

const companyNameFontSize = 32
const fontWeight = 500
const upperSectionFontSize = 22
const tableContentFontSize = 16
const midSectionFontSize = 20
const companyDetailsFontSize = 16
const disclaimerFontSize = 12

// Create a theme with the desired font family
const theme = createTheme({
    typography: {
      fontFamily: '宋体',
    },
  });



export function CustomFooterComponent(
    props: NonNullable<GridSlotsComponentsProps['footer']>,
) {
    const { invoiceItems, overridenTotalAmount, products } = props;

    const rmbFormat = formatRMB(overridenTotalAmount ?? invoiceItems?.reduce((acc, item) => acc + item.quantity * item.price, 0) ?? 0, "");

    // Need to use a map to store the number of boxes, bottles and pieces
    // for each product in the invoice items
    const productQuantityMap = new Map<string, number>();
    if (invoiceItems != undefined && products != undefined) {
        invoiceItems.forEach((item) => {
            const product = products.find((product) => product.productId === item.productId);
            if (product && product.unit) {
                const quantity = productQuantityMap.get(product.unit);
                if (quantity) {
                    productQuantityMap.set(product.unit, quantity + item.quantity);
                } else {
                    productQuantityMap.set(product.unit, item.quantity);
                }
            }
        });
    }

    return (
        <Grid container>
            <Grid item xs={2}>
                <Typography fontSize={tableContentFontSize} display="flex" justifyContent="left" paddingInlineEnd={10} fontWeight={fontWeight}>
                    合计：{
                        Array.from(productQuantityMap.entries()).map(([unit, quantity]) => {
                            return `${quantity}${unit}`;
                        }).join(", ")
                    }
                </Typography>
            </Grid>
            <Grid item xs={2}>
                <Typography fontSize={tableContentFontSize} display="flex" justifyContent="left" paddingInlineEnd={10} fontWeight={fontWeight}>
                    总计金额：{invoiceItems?.reduce((acc, item) => acc + item.quantity * item.price, 0)}
                </Typography>
            </Grid>
            <Grid item xs={2}>
                <Typography fontSize={tableContentFontSize} display="flex" justifyContent="left" paddingInlineEnd={10} fontWeight={fontWeight}>
                    应收金额：{overridenTotalAmount ?? invoiceItems?.reduce((acc, item) => acc + item.quantity * item.price, 0)}
                </Typography>
            </Grid>
            <Grid item xs={6}>
                <Typography fontSize={tableContentFontSize} display="flex" justifyContent="left" paddingInlineEnd={10} fontWeight={fontWeight}>
                    应收金额大写：{rmbFormat.value}
                </Typography>
            </Grid>
        </Grid>
    );
}

const InvoicePrintPage: React.FC<InvoicePrintPageProps> = (props) => {
    const [rows, setRows] = useState<PrintPageTableRowProps[]>([]);

    const authContext = useContext(AuthContext);
    const align = 'left';

    const columns: GridColDef[] = [
        {
            field: "index",
            headerName: "序号",
            width: 60,
            type: 'number',
            headerAlign: align,
            align: align,
        },
        { 
            field: 'productDisplayName', 
            headerName: '商品名称', 
            width: 400,
            type: 'string', 
            headerAlign: align, 
            align: align,
        },
        {
            field: "unit",
            headerName: "单位",
            width: 80,
            type: 'string',
            headerAlign: align,
            align: align
        },
        { 
            field: 'quantity', 
            headerName: '数量', 
            width: 75,
            type: 'string',
            headerAlign: align, 
            align: align 
        },
        { 
            field: 'price', 
            headerName: '单价', 
            width: 125,
            type: 'string' ,
            headerAlign: align, 
            align: align ,
            valueFormatter: (value?: string) => {
                if (value == null || value === "") {
                  return '';
                }
                return `¥${value}`;
            }
        },
        { 
            field: 'amount', 
            headerName: '金额', 
            width: 150,
            type: 'string',
            editable: false,
            headerAlign: align, 
            align: align,
            valueFormatter: (value?: string) => {
                if (value == null || value === "") {
                  return '';
                }
                return `¥${value}`;
            }
        },
        {
            field: "notes",
            headerName: "备注",
            width: 200,
            type: 'string',
            headerAlign: align,
            align: align
        }
    ]

    useEffect(() => {
        const newRows: PrintPageTableRowProps[] = props.invoiceItems.map((item, index) => {
            const product = props.products.find((product) => product.productId === item.productId);
            return {
                id: index.toString(),
                index: index + 1,
                productDisplayName: product ? buildDisplayNameForProduct(product, true, true) : "未知产品",
                unit: product?.unit ? product.unit : "",
                quantity: item.quantity.toString(),
                price: item.price.toFixed(2).toString(),
                amount: (item.quantity * item.price).toFixed(2).toString(),
                notes: item.notes
            }
        });

        setRows(newRows);

        // Need to use a map to store the number of boxes, bottles and pieces
        // for each product in the invoice items
        const productQuantityMap = new Map<string, number>();
        if (props.invoiceItems != undefined && props.products != undefined) {
            props.invoiceItems.forEach((item) => {
                const product = props.products.find((product) => product.productId === item.productId);
                if (product && product.unit) {
                    const quantity = productQuantityMap.get(product.unit);
                    if (quantity) {
                        productQuantityMap.set(product.unit, quantity + item.quantity);
                    } else {
                        productQuantityMap.set(product.unit, item.quantity);
                    }
                }
            });
        }

        const totalAmount = props.invoiceItems.reduce((acc, item) => acc + item.quantity * item.price, 0).toFixed(2).toString()

        const amountDue = props?.overridenTotalAmount?.toFixed(2).toString() ?? props.invoiceItems.reduce((acc, item) => acc + item.quantity * item.price, 0).toFixed(2).toString()

        // Add a row for the total amount and the amount due
        setRows((rows) => {
            return [
                ...rows,
                {
                    id: "total",
                    productDisplayName: "合计",
                    specification: "",
                    unit: "",
                    quantity: props.invoiceItems.reduce((acc, item) => acc + item.quantity, 0).toString(),
                    price: "",
                    amount: totalAmount,
                    notes: props.notes
                },
                {
                    id: "notes",
                    productDisplayName: "应收",
                    specification: "",
                    unit: "",
                    quantity: "",
                    price: "",
                    amount: amountDue,
                    notes: ""
                }
            ]
        });

    }, [])

    const contentToPrint = useRef(null);
    const handlePrint = useReactToPrint({
        documentTitle: "Print This Document",
        onAfterPrint: () => { 
            if (props.setPrintPreviewOpen) {
                props.setPrintPreviewOpen(false)
            }

            if (props.handleClearItems) {
                props.handleClearItems();
            }
        },
        removeAfterPrint: true
    });

    const gridContentAlign = "left"

    return (
        <ThemeProvider theme={theme}>
            <Paper elevation={3} sx={{paddingTop: 1}}>
                <div>
                    <Grid2 
                        container 
                        paddingInline={5} 
                        ref={contentToPrint}
                    >
                        <Grid2 xs={12} display="flex" justifyContent="center" paddingTop={2}>
                            <Typography fontSize={companyNameFontSize} fontWeight={800}>
                                {authContext.org === "tpy" ? "杭州富阳太平洋酒业有限公司销售订单" : ""}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={6} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={upperSectionFontSize} fontWeight={fontWeight}>
                                客户名称：{props.customerName}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={3} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={upperSectionFontSize} fontWeight={fontWeight}>
                                录单日期：{props.invoiceDate}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={3} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={upperSectionFontSize} fontWeight={fontWeight}>
                                单据编号：{props.invoiceId ? convertIdFormat(props.invoiceId) : ""}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={6} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={upperSectionFontSize} fontWeight={fontWeight}>
                                客户地址: 
                            </Typography>
                        </Grid2>

                        <Grid2 xs={3} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={upperSectionFontSize} fontWeight={fontWeight}>
                                联系电话：{props.customerContactNumber}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={3} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={upperSectionFontSize} fontWeight={fontWeight}>
                                结算方式：{props.settlementType === undefined ? '' : props.settlementType === 0 ? "现结" : "月结"}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={12} display="flex" justifyContent={gridContentAlign}>
                            <DataGrid
                                columns={columns}
                                rows={rows}
                                density="compact"
                                checkboxSelection={false}
                                disableRowSelectionOnClick={false}
                                autosizeOptions={{
                                    columns: ['productDisplayName', 'specification', 'quantity', 'price', 'amount'],
                                    includeOutliers: true,
                                    includeHeaders: false,
                                }}
                                hideFooter
                                scrollbarSize={0}
                                sx={{
                                    fontSize: 20, // Table content size
                                    border: 1,
                                    '.MuiDataGrid-scrollbar': {
                                        display: 'none', // Hide scrollbar for WebKit browsers
                                    },
                                    '& .MuiDataGrid-cell': {
                                        border: 1
                                    }
                                }}
                            />
                        </Grid2>

                        <Grid2 xs={4} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={midSectionFontSize} fontWeight={fontWeight}>
                                发货仓库：{props.warehouseName}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={4} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={midSectionFontSize} fontWeight={fontWeight}>
                                制单员：{props.billingClerkName}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={4} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={midSectionFontSize} fontWeight={fontWeight}>
                                发货员：{props.shippingClerkName}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={4} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={midSectionFontSize} fontWeight={fontWeight}>
                                送货员：
                            </Typography>
                        </Grid2>

                        <Grid2 xs={4} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={midSectionFontSize} fontWeight={fontWeight}>
                                业务员：{props.salespersonName}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={4} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={midSectionFontSize} fontWeight={fontWeight}>
                                客户签名:
                            </Typography>
                        </Grid2>

                        <Grid2 xs={12} display="flex" justifyContent={gridContentAlign} paddingBlock={5}>
                        </Grid2>

                        <Grid2 xs={12} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={companyDetailsFontSize}>
                                供货热线：{authContext.org === "tpy" ? "63320933/13968155869" : ""} 
                                <span style={{ marginLeft: "20px" }}></span> 
                                公司地址：{authContext.org === "tpy" ? "东兴路258号" : ""}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={12} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={companyDetailsFontSize}>
                                主营商品：{authContext.org === "tpy" ? "百威/哈尔滨啤酒、柚香谷、王老吉、红牛、农夫山泉、伊力酸奶、威龙红酒、五粮液、剑南春、郎酒、汾酒、伊力老陈、女儿红。" : ""}
                            </Typography>
                        </Grid2>

                        <Grid2 xs={12} display="flex" justifyContent={gridContentAlign}>
                            <Typography fontSize={disclaimerFontSize} fontWeight={fontWeight}>
                                客户收货时请当面验收核对，签收后视为认可货物质量及数量无误；如对货物有异议，应当场与供货方协调。
                                货物由收货方签字确认，此联同时作为购物收方收货尚未付款的结算凭证。
                                白色：存根联 / 红色：结算联 / 蓝色：客户联 / 黄单：提货联。
                            </Typography>
                        </Grid2>
                    </Grid2>
                </div>
                <Grid2 container>
                    <Grid2 xs={12} display="flex" justifyContent="right" paddingRight={5}>
                        <Button onClick={() => { handlePrint(null, () => contentToPrint.current); }}>
                            打印
                        </Button>
                    </Grid2>
                </Grid2>
            </Paper>
        </ThemeProvider>
    );
}

export default InvoicePrintPage;