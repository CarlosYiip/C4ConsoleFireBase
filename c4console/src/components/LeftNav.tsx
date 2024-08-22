// LeftNav.tsx
import { SwipeableDrawer, IconButton, List, ListItem, ListItemText, Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { useContext, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { AuthContext } from './auth/AuthProvider';


const LeftNav = () => {
    const { signOut } = useAuthenticator((context) => [context.user]);
    const authContext = useContext(AuthContext);

    const adminMenuItems = [
        { text: "AI助手", link: "/chatbot" },
        { text: "看板", link: "/dashboards" },
        { text: "发货", link: "/invoice" },
        { text: "退货", link: "/return" },
        { text: "产品库", link: "/product" },
        { text: "收款", link: "/receipt" },
        { text: "客户", link: "/customer" },
        { text: "业务员", link: "/salesperson" },
        { text: "送货员", link: "/driver" },
        { text: "库存", link: "/inventory" },
        { text: "仓库", link: "/warehouse" }
    ]

    const assistantMenuItems = [
        { text: "发货", link: "/invoice" },
        { text: "退货", link: "/return" },
        { text: "产品库", link: "/product" },
        { text: "收款", link: "/receipt" },
        { text: "客户", link: "/customer" },
        { text: "业务员", link: "/salesperson" },
        { text: "送货员", link: "/driver" },
        { text: "库存", link: "/inventory" },
    ]

    var menuItems = authContext.role === 'admin' ? adminMenuItems : assistantMenuItems;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const handleItemClick = (link: string) => {
        navigate(link)
    };

    const handleLogOut = () => {
        signOut();
        authContext.signOut();
        navigate('/')
        console.log('signed out')
    }

    return (
        <Box>
            <Stack
                direction="row"
                spacing={2}
            >
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={() => setDrawerOpen(!drawerOpen)}
                    size='large'
                >
                    <MenuIcon 
                        sx={{width: '3rem', height: '2rem'}}
                    />
                </IconButton>
                <SwipeableDrawer
                    variant="temporary"
                    anchor="left"
                    open={drawerOpen}
                    onOpen={() => setDrawerOpen(true)}
                    onClose={() => setDrawerOpen(false)}
                >
                    <List>
                        {menuItems.map((item, index) => (
                            <ListItem key={index} button={true} onClick={() => handleItemClick(item.link)}>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                        <ListItem button={true} onClick={() => handleLogOut()}>
                            <ListItemText primary="登出" />
                        </ListItem>
                    </List>
                </SwipeableDrawer>
            </Stack>
        </Box>
    );
};

export default LeftNav;