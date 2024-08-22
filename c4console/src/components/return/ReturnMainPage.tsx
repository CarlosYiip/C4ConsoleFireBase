import { Tab, Tabs } from "@mui/material";
import { useState } from "react";
import ReturnPage from "./ReturnPage";
import ReturnTable from "./ReturnTable";


const ReturnMainPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="创建退货" />
                <Tab label="退货记录" />
            </Tabs>
            {selectedTab === 0 && <ReturnPage />}
            {selectedTab === 1 && <ReturnTable />}
        </div>
    );
}

export default ReturnMainPage;