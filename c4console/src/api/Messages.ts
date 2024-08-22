import { AuthContextType } from "../components/auth/AuthProvider";
import { endpoint } from "./BackendApiProvider";

export interface Report {
    title: string,
    startDatetime: string,
    endDatetime: string,
    type: string,
    lastUpdatedDatetime: string,
    revenue?: number,
    received?: number,
    numberOfOrders?: number,
    revenueBySalesperson?: DataPoint[],
    revenueByCustomer?: DataPoint[],
    revenueByProduct?: DataPoint[],
    revenueByBrand?: DataPoint[],
    volumeByProduct?: DataPoint[],
    receivedBySalesperson?: DataPoint[],
    receivedByCustomer?: DataPoint[],
    receivedByProduct?: DataPoint[],
    receivedByBrand?: DataPoint[],
}

export interface StockReport {
    datetime: string,
    columns: string[],
    rows: {
        name: string,
        values: number[]
    }[]
}

export interface DataPoint {
    name: string,
    value: number
}

export interface Message {
    role: string
    content: string | object[]
    reports?: Report[]
    stockReports?: StockReport[]
    notToDisplay?: boolean
}

export interface SendMessageRequest {
    messages: Message[]
}

export interface SendMessageResponse {
    messages: Message[]
}

export const sendMessage = async (request: SendMessageRequest, authContext: AuthContextType): Promise<SendMessageResponse> => {
    const response = await fetch(
        `${endpoint}send_message`,
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authContext.idToken}`,
                'Custom-Header-Org': authContext?.org ?? '',
                'Custom-Header-Role': authContext?.role ?? '',
                'Custom-Header-Username': authContext?.username ?? ''
            },
            body: JSON.stringify(request),
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}