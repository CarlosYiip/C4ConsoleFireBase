// Chatbot.tsx
import React, { Dispatch, SetStateAction, useContext, useState } from 'react';
import {Card, CardContent, Container, Stack, Typography} from "@mui/material";
import InputComponent from './InputComponent';
import MessageComponent from './messages/MessageComponent';
import { BackendApiContext, } from '../../api/BackendApiProvider';
import { AuthContext, fetchAttributesAndTokens } from '../auth/AuthProvider';
import { Message } from '../../api/Messages';
import WelcomePage from './WelcomePage';
import { useApiCall } from '../hooks/useApiCallWithErrorHandler';

export interface ChatbotContextInterface {
    handleSendMessage: (userInput: string) => void,
    chosenConversationStarter: boolean,
    messages: Message[],
    setMessages: Dispatch<SetStateAction<Message[]>>,
    loading: boolean,
    setLoading: Dispatch<SetStateAction<boolean>>,
}

export const ChatbotContext = React.createContext({} as ChatbotContextInterface);

export const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [chosenConversationStarter, setChosenConversationStarter] = useState<boolean>(false);

    // console.log(messages)
    
    // This is a hacky solution to force fetching the user attributes and tokens
    const authContext = useContext(AuthContext);
    fetchAttributesAndTokens(authContext);

    const apiContext = useContext(BackendApiContext);
    const { callApi: sendMessage } = useApiCall(apiContext.sendMessage);

    const handleSendMessage = async (userInput: string) => {
        // Prevent sending empty messages
        if (userInput.replace(" ", "") === "") {
            return;
        }

        setUserInput('')
        setChosenConversationStarter(true);

        // Keep track of the messages of this round of conversation
        const messagesToAppend: Message[] = []
        const userMessage: Message = {
            role: "user",
            content: userInput
        }

        // Immediately re-render the component with the user message
        setMessages([...messages, userMessage])
        messagesToAppend.push(userMessage)

        setLoading(true)
        const sendMessageResponse = await sendMessage({messages: [...messages, ...messagesToAppend]})
        setLoading(false)
        setMessages(sendMessageResponse.messages)
    };
    
    return (
        <ChatbotContext.Provider value={{
            handleSendMessage, chosenConversationStarter, messages, setMessages, loading, setLoading
        }}>
            <Container maxWidth='xl'>
                <Stack spacing={2} alignItems="flexstart" height="100vh">
                    <Typography variant="h6" component="div" fontWeight={"bold"} fontSize={22}>
                        C4GPT
                    </Typography>

                    {!chosenConversationStarter && authContext.role == "admin" && <WelcomePage />}
                    <Card sx={{ height: "90%", boxShadow: "none", overflowY: "scroll"}}>
                        <CardContent>
                            {

                            messages.filter((it) => {
                                return it.content instanceof Array ? false : true
                            }).map((it) => (
                                <MessageComponent message={it} />
                            ))}
                        </CardContent>
                    </Card>
                    
                    <InputComponent 
                        userInput={userInput} 
                        setUserInput={setUserInput} 
                        handleSendMessage={handleSendMessage}
                        disabled={loading || authContext.role != 'admin'}
                    />
                </Stack>
            </Container>
        </ChatbotContext.Provider>
    );
};

export default Chatbot;
