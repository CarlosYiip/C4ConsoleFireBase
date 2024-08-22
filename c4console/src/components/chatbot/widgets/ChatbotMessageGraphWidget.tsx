import React, { useEffect, useState } from "react"
import { Typography, CardContent, Card, Grid } from "@mui/material";
import { DataPoint, Report } from "../../../api/Messages";
import { zhCN } from "@mui/x-data-grid/locales";
import { DataGrid } from "@mui/x-data-grid"

type GraphWidgetProps = {
    report: Report
}

const GraphWidget: React.FC<GraphWidgetProps> = ( { report }) => {
    const columnWidth = window.innerWidth / 8;
    const gridXs = 12
    const reportTitleSize = 24
    const reportSubtitleSize = 18
    const sx = { marginInline: -2, maxHeight: 800 }
    const density = "compact"

    return (
        <Grid container justifyContent="space-evenly" alignItems="center" spacing={5} marginBottom={5} marginTop={2}>

            {report.numberOfOrders && report.numberOfOrders > 0 && 
                <Grid item xs={12}>
                    <Typography variant="h6" fontSize={reportTitleSize} align={"center"} fontWeight={'bold'}>{report.title}</Typography>
                    <Typography variant="h6" fontSize={reportSubtitleSize} align={"center"} fontWeight={'bold'}>起始日期：{report.startDatetime.split(' ')[0]}</Typography>
                    <Typography variant="h6" fontSize={reportSubtitleSize} align={"center"} fontWeight={'bold'}>结束日期：{report.endDatetime.split(' ')[0]}</Typography>
                </Grid>
            }
            
            {(report.revenueByCustomer && report.revenueByCustomer.length > 0) && 
                <Grid item xs={gridXs}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" align={"center"} fontSize={16} fontWeight={'bold'}>各客户销售额</Typography>
                            <DataGrid
                                density={density}
                                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                                initialState={{ columns: { columnVisibilityModel: { id: false } } }}
                                columns={[
                                    { field: 'id', headerName: 'id', width: 0 },
                                    { field: 'customerName', headerName: '客户', flex: columnWidth, headerAlign: "center", align: "center" },
                                    { field: 'revenue', headerName: '金额', flex: columnWidth, headerAlign: "center", align: "center" },
                                ]}
                                rows={report.revenueByCustomer.map((dataPoint: DataPoint, index: number) => { return { id: index, customerName: dataPoint.name, revenue: dataPoint.value }; })}
                                checkboxSelection={false}
                                disableRowSelectionOnClick={false}
                                hideFooter
                                sx={sx}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            }

            {(report.revenueByProduct && report.revenueByProduct.length > 0) &&
                <Grid item xs={gridXs}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" align={"center"} fontSize={16} fontWeight={'bold'}>各产品销售额</Typography>
                            <DataGrid
                                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                                initialState={{ columns: { columnVisibilityModel: { id: false } } }}
                                columns={[
                                    { field: 'id', headerName: 'id', width: 0 },
                                    { field: 'productName', headerName: '产品', flex: columnWidth, headerAlign: "center", align: "center" },
                                    { field: 'revenue', headerName: '金额', flex: columnWidth, headerAlign: "center", align: "center" },
                                ]}
                                rows={report.revenueByProduct.map((dataPoint: DataPoint, index: number) => { return { id: index, productName: dataPoint.name, revenue: dataPoint.value }; })}
                                checkboxSelection={false}
                                disableRowSelectionOnClick={false}
                                hideFooter
                                sx={sx}
                                density={density}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            }

            {(report.revenueByBrand && report.revenueByBrand.length > 0)&&
                <Grid item xs={gridXs}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" align={"center"} fontSize={16} fontWeight={'bold'}>各品牌销售额</Typography>
                            <DataGrid
                                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                                initialState={{ columns: { columnVisibilityModel: { id: false } } }}
                                columns={[
                                    { field: 'id', headerName: 'id', width: 90 },
                                    { field: 'brandName', headerName: '品牌', flex: columnWidth, headerAlign: "center", align: "center" },
                                    { field: 'revenue', headerName: '金额', flex: columnWidth, headerAlign: "center", align: "center" },
                                ]}
                                rows={report.revenueByBrand.map((dataPoint: DataPoint, index: number) => { return { id: index, brandName: dataPoint.name, revenue: dataPoint.value }; })}
                                checkboxSelection={false}
                                disableRowSelectionOnClick={false}
                                hideFooter
                                sx={sx}
                                density={density}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            }

            {(report.revenueBySalesperson && report.revenueBySalesperson.length > 0)&&
                <Grid item xs={gridXs}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" align={"center"} fontSize={16} fontWeight={'bold'}>各业务员销售额</Typography>
                            <DataGrid
                                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                                initialState={{ columns: { columnVisibilityModel: { id: false } } }}
                                columns={[
                                    { field: 'id', headerName: 'id', width: 90 },
                                    { field: 'salespersonName', headerName: '销售员', flex: columnWidth, headerAlign: "center", align: "center" },
                                    { field: 'revenue', headerName: '金额', flex: columnWidth, headerAlign: "center", align: "center" },
                                ]}
                                rows={report.revenueBySalesperson.map((dataPoint: DataPoint, index: number) => { return { id: index, salespersonName: dataPoint.name, revenue: dataPoint.value }; })}
                                checkboxSelection={false}
                                disableRowSelectionOnClick={false}
                                hideFooter
                                sx={sx}
                                density={density}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            }

            {(report.volumeByProduct && report.volumeByProduct.length > 0) &&
                <Grid item xs={gridXs}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" align={"center"} fontSize={16} fontWeight={'bold'}>各产品销量</Typography>
                            <DataGrid
                                localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                                initialState={{ columns: { columnVisibilityModel: { id: false } } }}
                                columns={[
                                    { field: 'id', headerName: 'id', headerAlign: "center", align: "center", width: 90 },
                                    { field: 'productName', headerName: '产品', headerAlign: "center", align: "center", flex: columnWidth },
                                    { field: 'volume', headerName: '数量', headerAlign: "center", align: "center", flex: columnWidth },
                                ]}
                                rows={report.volumeByProduct.map((dataPoint: DataPoint, index: number) => { return { id: index, productName: dataPoint.name, volume: dataPoint.value }; })}
                                checkboxSelection={false}
                                disableRowSelectionOnClick={false}
                                hideFooter
                                sx={sx}
                                density={density}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            }
        </Grid> 
    )
}

export default GraphWidget