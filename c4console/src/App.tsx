// App.tsx
import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import LeftNav from './components/LeftNav';
import Chatbot from "./components/chatbot/ChatBotComponent";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import InvoiceMainPage from './components/invoice/InvoiceMainPage';
import ReceiptsMainPage from './components/receipt/ReceiptsMainPage';
import CustomerMainPage from './components/customer/CustomerMainPage';
import SalespersonMainPage from './components/salesperson/SalespersonMainPage';
import WarehouseMainPage from './components/warehouse/WarehouseMainPage';
import InventoryMainPage from './components/inventory/InventoryMainPage';
import ProductMainPage from './components/product/ProductMainPage';
import { AuthContext, fetchAttributesAndTokens } from './components/auth/AuthProvider';
import BackendApiProvider from './api/BackendApiProvider';
import { CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './components/context/NotificationContext';
import DriverMainPage from './components/driver/DriverMainPage';
import ReturnMainPage from './components/return/ReturnMainPage';
import DashboardMainPage from './components/dashboards/DashboardMainPage';

const queryClient = new QueryClient()

const App: React.FC = () => {
    const [userDetailesReady, setUserDetailsReady] = useState(true);

    const theme = createTheme({});

    const authContext = useContext(AuthContext);

    useEffect(() => {
        fetchAttributesAndTokens(authContext)
        .then(() => {
            setUserDetailsReady(true);
        })
        .catch((error) => {
            console.error(error);
        });
    }, [])

    if (!userDetailesReady) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </div>
        );
    }

    return (
        <NotificationProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <BackendApiProvider>
                        <Router>
                            <LeftNav/>
                            <Routes>
                                <Route path="/" element={<Chatbot />} />
                                <Route path="/chatbot" element={<Chatbot />} />
                                <Route path="/dashboards" element={<DashboardMainPage />} />
                                <Route path="/customer" element={<CustomerMainPage />} />
                                <Route path="/invoice" element={<InvoiceMainPage />} />
                                <Route path="/return" element={<ReturnMainPage />} />
                                <Route path="/receipt" element={<ReceiptsMainPage />} />
                                <Route path="/salesperson" element={<SalespersonMainPage />} />
                                <Route path="/driver" element={<DriverMainPage />} />
                                <Route path="/product" element={<ProductMainPage />} />
                                <Route path="/inventory" element={<InventoryMainPage />} />
                                <Route path="/warehouse" element={<WarehouseMainPage />} />
                            </Routes>
                        </Router>
                    </BackendApiProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </NotificationProvider>
    );
};

export default App;