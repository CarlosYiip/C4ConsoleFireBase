import React, { createContext, useState, ReactNode } from 'react';
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

    setUser("yipper", "tpy", "admin");
}