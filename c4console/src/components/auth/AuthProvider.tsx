import React, { createContext, useState, ReactNode } from 'react';
import { AuthError, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth'
import { queryClient } from '../../api/Common';

export interface AuthContextType {
    username?: string
    org?: string;
    role?: string;
    accessToken?: string,
    idToken?: string,
    setUser: (username: string, org: string, role: string) => void;
    setTokens: (acccessToken: string, idToken: string) => void;
    signOut: () => void;
    userAttributesReady: () => boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [isJustSignedOut, setIsJustSignedOut] = useState<boolean>(false);
    const [username, setUsername] = useState<string | undefined>(undefined);
    const [org, setOrg] = useState<string | undefined>(undefined);
    const [role, setRole] = useState<string | undefined>(undefined);
    const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
    const [idToken, setIdToken] = useState<string | undefined>(undefined);

    const setUser = (newName: string, newOrg: string, newRole: string) => {
        setUsername(newName);
        setOrg(newOrg);
        setRole(newRole);
    };

    const setTokens = (newAccessToken: string, newIdToken: string) => {
        setAccessToken(newAccessToken);
        setIdToken(newIdToken);
    }
    
    const signOut = () => {
        setIsJustSignedOut(false);
        setUsername(undefined);
        setOrg(undefined);
        setRole(undefined);
        setAccessToken(undefined);
        setIdToken(undefined);
        queryClient.clear();
    };

    const userAttributesReady = () => {
        return username !== undefined && org !== undefined && role !== undefined;
    }

    return (
        <AuthContext.Provider value={{ 
            username,org, role, accessToken, idToken, setUser, setTokens, signOut, userAttributesReady
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const fetchAttributesAndTokens = async (authContext: AuthContextType) => {
    const { setUser, setTokens } = authContext;

    if ((authContext.username === undefined ||
        authContext.org === undefined || 
        authContext.role === undefined || 
        authContext.idToken === undefined || 
        authContext.accessToken === undefined)
    ) {
        try {
            const attributes = await fetchUserAttributes();

            if (attributes["custom:username"] === undefined) {
                throw new Error("User does not have a username");
            }

            if (attributes["custom:org"] === undefined) {
                throw new Error("User does not have an organization");
            }

            if (attributes["custom:role"] === undefined) {
                throw new Error("User does not have a role");
            }

            setUser(attributes["custom:username"], attributes["custom:org"], attributes["custom:role"]);

            const {accessToken, idToken} = (await fetchAuthSession()).tokens ?? {};

            if (accessToken === undefined || idToken === undefined) {
                throw new Error("Failed to fetch tokens");
            }

            setTokens(accessToken.toString(), idToken.toString());

        } catch (error: any) {
            // This is a dirty fix for the log out runtime error.
            if (error instanceof AuthError ) {
                console.info('Error fetching attributes and tokens because of auth error ', error);
            } else {
                throw error;
            }
        }
    }
}