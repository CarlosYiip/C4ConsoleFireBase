import { Card, CardContent, Grid, Typography } from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { zhCN } from "@mui/x-data-grid/locales";

type TableWidgetProps = {
    datetime: string,
    columns: string[],
    rows: {
        name: string,
        values: number[]
    }[]
}

const TableWidget: React.FC<TableWidgetProps> = ({datetime, columns, rows}) => {

    if (columns.length === 0 || rows.length === 0) {
        return <></>
    }

    const gridXs = 12
    const reportTitleSize = 24
    const reportSubtitleSize = 18
    const density = "compact"

    const dataGridColumns: GridColDef[] = [
        {
            field: 'productName',
            type: 'string',
            headerName: '产品名',
            width: 200,
            headerAlign: "center",
            align: "center"
        },
        {
            field: 'sum',
            type: 'number',
            headerName: '总计',
            width: 200,
            headerAlign: "center",
            align: "center"

        }
    ]

    columns.forEach((column, index) => {
        // If all the rows in this column are 0, then don't show this column
        const allZero = rows.every(row => row.values[index] === 0)
        if (allZero) {
            return
        }

        dataGridColumns.push({
            field: column,
            type: 'number',
            headerName: column,
            width: 150,
            headerAlign: "center",
            align: "center"
        })
    })

    return (
        <Grid container justifyContent="space-evenly" alignItems="center" spacing={5} marginBottom={5} marginTop={2}>
            {
                rows.length > 0 && columns.length > 0 && (
                    <>
                        <Grid item xs={12}>
                            <Typography variant="h6" fontSize={reportTitleSize} align={"center"} fontWeight={'bold'}>库存报告</Typography>
                            <Typography variant="h6" fontSize={reportSubtitleSize} align={"center"} fontWeight={'bold'}>日期时间：{datetime}</Typography>
                        </Grid>

                        <Grid item xs={gridXs}>
                            <Card>
                                <CardContent>
                                    <DataGridPremium
                                        density={density}
                                        localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
                                        initialState={
                                            { 
                                                pagination: { paginationModel: { pageSize: 100 } },
                                                pinnedColumns: { left: ['productName'] }
                                            }
                                        }
                                        columns={dataGridColumns}
                                        rows={
                                            rows.map((row, index) => {
                                                const sum = row.values.reduce((a, b) => a + b, 0)
                                                const rowObject: { [key: string]: number | string } = {
                                                    "id": index,
                                                    "productName": row.name,
                                                    "sum": sum,
                                                }

                                                row.values.map((value, index: number) => {
                                                    rowObject[columns[index]] = value
                                                })
                                                return rowObject

                                            })
                                        }
                                        checkboxSelection={false}
                                        disableRowSelectionOnClick={false}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )
            }
        </Grid>
    )
}

export default TableWidget;