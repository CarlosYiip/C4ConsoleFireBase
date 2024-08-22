import UserMessage from './UserMessage';
import BotMessage from './BotMessage';
import React from 'react';
import { Message } from '../../../api/Messages';

export interface MessageComponentProps {
    message: Message;
}

const MessageComponent: React.FC<MessageComponentProps> = ({message}) => {
    console.log("MessageComponent")
    console.log(message)
    return (
        <>
            {message.role === "user" ? (
                <UserMessage message={message} />
            ) : (
                <BotMessage message={message} />
            )}
        </>
    );
}

export default React.memo(MessageComponent);