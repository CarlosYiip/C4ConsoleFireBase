import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ProductsTable from './ProductsTable';
import PriceTable from './PriceTable';

const ProductMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="产品列表" />
                <Tab label="价格表" />
            </Tabs>
            {selectedTab === 0 && <ProductsTable />}
            {selectedTab === 1 && <PriceTable />}
        </div>
    );
};

export default ProductMainPage;
