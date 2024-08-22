import { AuthContextType } from "../components/auth/AuthProvider";
import { endpoint } from "./BackendApiProvider";
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient(
    {
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5
            }
        }
    }
);

function objectToHexString(obj: object): string {
    // Step 1: Serialize the object into a JSON string
    const jsonString = JSON.stringify(obj);
    
    // Step 2: Encode the JSON string into a Uint8Array
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    // Step 3: Convert the byte array to a hex string
    const hexString = Array.from(dataBuffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    
    return hexString;
}
export class Exception extends Error {
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }

    statusCode: number;
}

export const apiRequest = async <T>(
    path: string,
    request: any,
    authContext: AuthContextType
): Promise<T> => {
    const cacheKey = `${path}-${objectToHexString(request)}`;
    const data = await queryClient.fetchQuery({ 
        queryKey: [cacheKey], 
        queryFn: async () => {
            const response = await fetch(
                `${endpoint}${path}`,  
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authContext.idToken}`,
                        'Custom-Header-Org': authContext?.org ?? '',
                        'Custom-Header-Role': authContext?.role ?? '',
                        'Custom-Header-Username': authContext?.username ?? ''
                    },
                    body: JSON.stringify(request)
                });

            if (!response.ok) {
                throw new Exception(await response.text(), response.status);
            }
            
            // This is a temp solution to remove null values from the response
            return await response.json().then(data => 
                JSON.parse(JSON.stringify(data), (key, value) => 
                    value === null ? undefined : value
                )
            );
        }
    })

    return data
};
