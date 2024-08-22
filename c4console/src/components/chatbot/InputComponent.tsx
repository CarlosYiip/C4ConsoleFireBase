import { TextField } from '@mui/material';
import { Box } from '@mui/material';


import React from 'react';

interface InputProps {
    userInput: string;
    setUserInput: (input: string) => void;
    handleSendMessage: (input: string) => Promise<void>;
    disabled: boolean;
}

const InputComponent: React.FC<InputProps> = ({ userInput, setUserInput, handleSendMessage, disabled }) => {
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSendMessage(userInput);
        }
    };

    return (
        <Box display="flex" alignItems="flex-end">
            <TextField
                variant={"outlined"}
                placeholder="请输入你的问题"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{marginBottom: 10}}
                disabled={disabled}
                multiline
                maxRows={4}
                fullWidth
            />
        </Box>
    );
}

export default InputComponent;