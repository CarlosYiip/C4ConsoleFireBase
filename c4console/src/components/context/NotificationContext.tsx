import React, { createContext, useState, ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

interface NotificationContextProps {
    setNotification: (message: string) => void;
}

export const NotificationContext = createContext<NotificationContextProps>(
    {} as NotificationContextProps
);

export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [notification, setNotification] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        setOpen(false);
    };

    const handleSetNotification = (message: string) => {
        setNotification(message);
        setOpen(true);
    };

    return (
        <NotificationContext.Provider value={{ setNotification: handleSetNotification }}>
            {children}
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{vertical: "top", horizontal: "center"}}>
                <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
                    {notification}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};