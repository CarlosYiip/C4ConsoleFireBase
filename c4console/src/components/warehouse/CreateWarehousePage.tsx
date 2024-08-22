import { Box, Button, CircularProgress, Container, Grid, Paper, TextField, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { BackendApiContext } from '../../api/BackendApiProvider';
import { AuthContext } from '../auth/AuthProvider';

const CreateWarehousePage = () => {
    const [warehouseName, setWarehouseName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleClearItems = () => {
        setWarehouseName('');
        setAddress('');
    };

    const apiContext = useContext(BackendApiContext);
    const authContext = useContext(AuthContext);

    const handleSubmitWarehouse = async () => {
        setLoading(true);
        await apiContext.createWarehouse({
            warehouseName: warehouseName,
            address: address,
        }, authContext);
        handleClearItems();
        setLoading(false);
    }

    return (
        <Container>
            <Box mt={2}>
                <Paper elevation={3}>
                    <Box p={2}>
                        <Typography variant="h4" align="center" style={{ fontSize: '2rem' }}>仓库明细</Typography>
                    </Box>
                    <Box p={2}>
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Typography variant="h6">仓库名</Typography>
                                <Box maxWidth={"50%"}>
                                    <TextField
                                        fullWidth
                                        value={warehouseName}
                                        onChange={(event) => setWarehouseName(event.target.value)}
                                        size="small"
                                        type="string"
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="h6">地址</Typography>
                                <Box maxWidth={"50%"}>
                                    <TextField
                                        fullWidth
                                        value={address}
                                        onChange={(event) => setAddress(event.target.value)}
                                        size="small"
                                        type="string"
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box p={2} display="flex" justifyContent="flex-end" mt={2} mr={13}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleSubmitWarehouse} 
                            disabled={
                                loading || warehouseName === '' || address === '' 
                            }
                        >
                            {loading ? <CircularProgress size={24} /> : '确认'}
                        </Button>
                        <Button 
                            variant="outlined"
                            color="secondary"
                            onClick={handleClearItems} 
                            disabled={loading} 
                            style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}
                        >
                            清空
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};


export default CreateWarehousePage;
