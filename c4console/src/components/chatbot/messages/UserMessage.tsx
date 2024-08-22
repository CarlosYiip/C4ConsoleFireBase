import { Grid, Typography, LinearProgress } from '@mui/material';
import { MessageComponentProps } from "./MessageComponent";
import MuiMarkdown from 'mui-markdown';
import { useContext } from 'react';
import { ChatbotContext } from '../ChatBotComponent';


// UserMessage component
export const UserMessage: React.FC<MessageComponentProps> = ({message}) => {
    const { messages, setMessages, loading, setLoading } = useContext(ChatbotContext);
    const isLast = messages[messages.length - 1] === message
    return (
        <Grid item xs={12}>
            <Typography variant="body2" sx={{color: "black", fontWeight: 'bold'}}>
                You
            </Typography>
            <Typography variant="body2">
                <MuiMarkdown>{ message.content as string }</MuiMarkdown>
            </Typography>

            {isLast && loading &&
                <>
                <br/>
                <Typography variant="body2" sx={{color: "black", fontWeight: 'bold'}}>
                    C4GPT
                </Typography>
                <LinearProgress sx={{width: '20%', paddingTop: '10px'}}/>
                </>
            }
        </Grid>
    );
}

export default UserMessage;