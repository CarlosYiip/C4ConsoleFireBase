import { Button, Card, Grid, Stack, Typography } from "@mui/material"
import CardContent from '@mui/material/CardContent';
import React, { useContext, useEffect } from "react";
import { ChatbotContext } from "./ChatBotComponent";
import { AuthContext } from "../auth/AuthProvider";
import { BackendApiContext } from "../../api/BackendApiProvider";
import { Salesperson } from '../../api/Salespersons';
import { Customer } from "../../api/Customers";
import { Warehouse } from "../../api/Warehouses";

const WelcomePage = () => {
    const { handleSendMessage, chosenConversationStarter } = useContext(ChatbotContext);
    const [salespersons, setSalespersons] = React.useState<Salesperson[]>([]);
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])

    const apiContext = useContext(BackendApiContext);
    const authContext = useContext(AuthContext);

    const fetchData = async () => {
        await apiContext.querySalespersons({}, authContext).then((response) => setSalespersons(response.salespersons));
        await apiContext.queryCustomers({}, authContext).then((response) => setCustomers(response.customers));
        await apiContext.queryWarehouses({}, authContext).then((response) => setWarehouses(response.warehouses));
    }

    useEffect(() => {
        fetchData();
    }, [])


    const xs = 12
    if (!chosenConversationStarter) {
        return (
            <Grid container>
                <Grid xs={12} >
                    <Typography fontSize={30} fontWeight={'Bold'}>
                        {authContext.username}-{authContext.org}-{authContext.role} 您好!
                    </Typography>
                </Grid>
                <Grid xs={12} >
                    <Typography fontSize={20} marginTop={2}>
                        我可以回答您关于进销存的问题,例如.
                    </Typography>
                </Grid>
                <Grid xs={xs} marginTop={2}>
                    <ConversationStarterCard title={"销售"} messages={overallSalesStarters()} handleSendMessage={handleSendMessage}/>
                </Grid>
            </Grid>
        )
    } else {
        return <></>
    }
}

export default WelcomePage



const overallSalesStarters = (): string[] => {
    return [
        "本月的整体销售数据",
        "上个月的销售状况",
        "帮我对比分析一下本月和上个月的销售状况",
        
    ]
}

const productStarters = (): string[] => {
    return [
        "上月卖了多少柚香谷",
        "这个月卖了多少百威",
        "这个月卖了多少的郎酒"
    ]
}

const customerStarters = (customers: Customer[]): string[] => {
    // randomly select 5 customers from the list
    const selectedCustomers = customers.sort(() => 0.5 - Math.random()).slice(0, 3);

    return selectedCustomers.map((customer) => {
        return `${customer.customerName}近期3个月的销售情况`
    })
}

const salespersonStarters = (salespersons: Salesperson[]): string[] => {
    // randomly select 5 salespersons from the list
    const selectedSalespersons = salespersons.sort(() => 0.5 - Math.random()).slice(0, 3);
    return selectedSalespersons.map((salesperson) => {
        return `${salesperson.salespersonName}本月的业绩`
    })
}

const inventoryStarters = (warehouses: Warehouse[]): string[] => {
    return [
        "各个仓库的库存情况",
        "青花郎库存还有多少",
        "受降仓库有多少柚香谷"
    ]
}

interface ConversationStarterCardProps {
    title: string
    messages: string[],
    handleSendMessage: (message: string) => void
}


const ConversationStarterCard: React.FC<ConversationStarterCardProps> = (
    {title, messages, handleSendMessage}
) => {

    return (
        <Card variant="outlined" sx={{ borderRadius: 8, marginRight: 2}} >
            <CardContent>
                <Typography sx={{ fontSize: 24 }} >
                    {title}
                </Typography>
                <br/>

                <Stack spacing={2}>
                    {
                        messages.map((message, index) => (
                            <Button 
                                key={index} 
                                sx={{ justifyContent: 'flex-start' }}
                                onClick={() => handleSendMessage(message)}
                            >
                                <Typography align="left">
                                    {message}
                                </Typography>
                            </Button>
                        ))
                    }
                </Stack>
            </CardContent>
        </Card>
    )
}
