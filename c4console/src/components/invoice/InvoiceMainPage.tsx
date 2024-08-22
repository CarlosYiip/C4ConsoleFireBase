import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import InvoicePage from './InvoicePage';
import InvoiceTable from './InvoiceTable';

const InvoiceMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="创建订单" />
                <Tab label="订单记录" />
            </Tabs>
            {selectedTab === 0 && <InvoicePage />}
            {selectedTab === 1 && <InvoiceTable />}
        </div>
    );
};

export default InvoiceMainPage;
