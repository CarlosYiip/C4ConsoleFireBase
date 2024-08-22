import React, { useContext, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ComprehensiveDashboard from './ComprehensiveDashboard';
import { AuthContext } from '../auth/AuthProvider';

const CustomerMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    const authContext = useContext(AuthContext);

    if (authContext.role !== 'admin') {
        return (<div>权限不足</div>)
    }

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="综合看板" />
            </Tabs>
            {selectedTab === 0 && <ComprehensiveDashboard />}
        </div>
    );
};

export default CustomerMainPage;
