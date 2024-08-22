import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CreateReceiptPage from './CreateReceiptPage';
import ReceiptsTable from './ReceiptsTable';
import PaymentAccountsTable from './PaymentAccountsTable';

const ReceiptsMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="创建收款单" />
                <Tab label="收款记录" />
                <Tab label="收款账户" />
            </Tabs>
            {selectedTab === 0 && <CreateReceiptPage />}
            {selectedTab === 1 && <ReceiptsTable />}
            {selectedTab === 2 && <PaymentAccountsTable/>}
        </div>
    );
};

export default ReceiptsMainPage;
