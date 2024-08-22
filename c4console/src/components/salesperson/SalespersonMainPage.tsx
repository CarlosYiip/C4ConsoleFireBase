import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SalespersonTable from './SalespersonTable';
import SalespersonDashboard from './SalespersonDashboard';

const SalespersonMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="业务员列表" />
                <Tab label="业务员看板" />
            </Tabs>
            {selectedTab === 0 && <SalespersonTable />}
            {selectedTab === 1 && <SalespersonDashboard />}
        </div>
    );
};

export default SalespersonMainPage;
