import React, { MutableRefObject } from 'react';
import { List, ListItem, ListItemText, ListItemIcon, DialogContentText, DialogActions, Button } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle } from "@mui/material";

export interface DuplicateItemsList {
    items: any[],
    open: boolean,
    setOpen: (isOpen: boolean) => void,
    apiToCall: () => Promise<any>,
    setLoading: (isLoading: boolean) => void
}

const DuplicateItemsList: React.FC<DuplicateItemsList> = ({ 
  items,
  setOpen,
  open,
  apiToCall,
  setLoading
}) => {
    if (!items || items.length === 0) {
        return null;
    }

    const handleClose = () => {
        setLoading(false)
        setOpen(false);
    }

    const handleProceed = async () => {
        await apiToCall();
    }

    return (
        <div>
            <Dialog open={open}>
                <DialogTitle>相似产品</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        以下是相似产品，请确认是否为重复产品
                    </DialogContentText>
                    <List>
                        {items.map((item, index) => (
                            <ListItem key={index} divider>
                                <ListItemIcon>
                                    <Warning />
                                </ListItemIcon>
                                <ListItemText primary={item.name} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                <Button onClick={handleClose} color="primary">
                    取消
                </Button>
                <Button onClick={handleProceed} color="primary">
                    确认
                </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default DuplicateItemsList;