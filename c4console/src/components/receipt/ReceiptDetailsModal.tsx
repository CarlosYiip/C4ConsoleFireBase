import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogContent, DialogActions, Grid, Typography, DialogContentText } from '@mui/material';
import { CircularProgress } from '@mui/material'; 
import { BackendApiContext } from '../../api/BackendApiProvider';
import { AuthContext } from '../auth/AuthProvider';

interface ReceiptsDetailsModalProps {
    receipt: any | null;
    open: boolean;
    handleClose: () => void;
    onReceiptDeleted: () => void;
}

const ReceiptsDetailsModal: React.FC<ReceiptsDetailsModalProps> = ({ receipt, open, handleClose, onReceiptDeleted }) => {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = () => {
        setConfirmOpen(true);
    };

    const apiContext = useContext(BackendApiContext);
    const authContext = useContext(AuthContext)

    const handleConfirmDelete = async () => {
        setLoading(true);
        try {
            await apiContext.deleteReceipt({ receiptId: receipt!!.id }, authContext);
            handleClose();
            onReceiptDeleted();
        } catch (error) {
            console.error('Error deleting receipt:', error);
        } finally {
            setLoading(false);
        }
        setConfirmOpen(false);
    };


    return (
        <Dialog open={open && receipt != null} onClose={handleClose}>
            <DialogContent>
                <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography>日期时间: {receipt?.createDatetime}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography>客户: {receipt?.customerName}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography>业务员: {receipt?.salespersonName}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography>付款方式: {receipt?.paymentType}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6">金额: {receipt?.totalAmount}</Typography>
                        </Grid>
                    </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDelete} color="error" disabled={receipt == null || loading}>
                    {loading ? <CircularProgress size={24} /> : '删除'} {/* Render CircularProgress when loading */}
                </Button>
                <Button onClick={handleClose}>关闭</Button>
            </DialogActions>
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
            >
                <DialogContent>
                    <DialogContentText>
                        确认删除此收据？
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="primary">
                        取消
                    </Button>
                    <Button onClick={handleConfirmDelete} color="primary" autoFocus>
                        确认
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default React.memo(ReceiptsDetailsModal);
