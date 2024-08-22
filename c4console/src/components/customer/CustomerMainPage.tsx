import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CustomerTable from './CustomerTable';
import CustomerDashboard from './CustomerDashboard';
import CustomerPricingTable from './CustomerPricingTable';

const CustomerMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="客户列表" />
                <Tab label="客户看板" />
                <Tab label="客户价格表" />
            </Tabs>
            {selectedTab === 0 && <CustomerTable />}
            {selectedTab === 1 && <CustomerDashboard />}
            {selectedTab === 2 && <CustomerPricingTable />}
        </div>
    );
};

export default CustomerMainPage;
