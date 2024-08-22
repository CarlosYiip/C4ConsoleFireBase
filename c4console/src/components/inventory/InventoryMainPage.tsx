import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import InventoryTable from '../inventory/InventoryTable';
import CreateInventoryItemsPage from './CreateInventoryItemsPage';
import InventoryChangeRecordsTable from './InventoryChangeRecordsTable';
import DeductInventoryItemsPage from './DeductInventoryItemsPage';
import TransferInventoryItemsPage from './TransferInventoryItemsPage';
import InventoryDashboard from './InventoryDashboard';

const InventoryMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="库存" />
                <Tab label="入库" />
                <Tab label="调货" />
                <Tab label="出库" />
                <Tab label="变更记录" />
                <Tab label="库存看板" />
            </Tabs>
            {selectedTab === 0 && <InventoryTable />}
            {selectedTab === 1 && <CreateInventoryItemsPage />}
            {selectedTab === 2 && <TransferInventoryItemsPage />}
            {selectedTab === 3 && <DeductInventoryItemsPage />}
            {selectedTab === 4 && <InventoryChangeRecordsTable />}
            {selectedTab === 5 && <InventoryDashboard />}
        </div>
    );
};

export default InventoryMainPage;
