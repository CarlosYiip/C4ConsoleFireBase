import { Tab, Tabs } from "@mui/material";
import { useState } from "react";
import DriverTable from "./DriverTable";

const DriverMainPage: React.FC = () => {

    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div style={{ marginLeft:30 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="送货员列表" />
            </Tabs>
            {selectedTab === 0 && <DriverTable/>}
        </div>
    )
}

export default DriverMainPage;