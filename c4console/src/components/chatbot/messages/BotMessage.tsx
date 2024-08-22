import { Grid, Typography } from '@mui/material';
import MuiMarkdown from 'mui-markdown';
import { MessageComponentProps } from './MessageComponent';
import GraphWidget from '../widgets/ChatbotMessageGraphWidget';
import TableWidget from '../widgets/TableWidget';

export const BotMessage: React.FC<MessageComponentProps> = ({message}) => {
    const messageContent = message.content as string
    const shouldDisplayReports = message.reports && message.reports.length > 0 || message.stockReports && message.stockReports.length > 0
    return (
        <Grid item xs={12}>
            <Typography variant="body2" sx={{color: "black", fontWeight: 'bold'}}>
                C4GPT
            </Typography>
            <Typography variant="body2">
                <MuiMarkdown>{ messageContent }</MuiMarkdown>
            </Typography>
            {
                shouldDisplayReports && message.reports?.map((report) => (
                    <GraphWidget report={report}/>
                ))
            }
            {
                shouldDisplayReports && message.stockReports?.map((stockReport) => (
                    <TableWidget columns={stockReport.columns} rows={stockReport.rows} datetime={stockReport.datetime}/>
                ))
            }
        </Grid>
    );
}

export default BotMessage;