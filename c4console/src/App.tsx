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
import AuthPage from './components/auth/AuthComponent';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import { AuthContext, fetchAttributesAndTokens } from './components/auth/AuthProvider';
import BackendApiProvider from './api/BackendApiProvider';
import { CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './components/context/NotificationContext';
import DriverMainPage from './components/driver/DriverMainPage';
import ReturnMainPage from './components/return/ReturnMainPage';
import DashboardMainPage from './components/dashboards/DashboardMainPage';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.REACT_APP_USER_POOL_ID ?? 'ap-northeast-2_fvvyNBJ4y',
            userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID ?? '2unotjd32pts7e3i4d42aaihon',
            loginWith: {
                email: true,
                username: true,
                phone: true
            }
        }
    }
});

const queryClient = new QueryClient()

const App: React.FC = () => {
    const [userDetailesReady, setUserDetailsReady] = useState(false);

    const theme = createTheme({});

    const { authStatus } = useAuthenticator();
    const isAuthenticated = (): boolean => {
        return authStatus === 'authenticated';
    };

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
                            {isAuthenticated() ? (
                                <>
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
                                </>
                            ) : (
                                <AuthPage></AuthPage>
                            )}
                        </Router>
                    </BackendApiProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </NotificationProvider>
    );
};

export default App;