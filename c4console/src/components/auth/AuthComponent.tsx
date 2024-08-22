import React from 'react';
import { I18n } from 'aws-amplify/utils';
import { signIn, SignInOutput } from 'aws-amplify/auth'
import { Authenticator, translations } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

I18n.setLanguage('zh')
I18n.putVocabularies(translations);

const formFields = {
    signIn: {
        username: {
            placeholder: '请输入您的邮箱',
            isRequired: true
        },
        password: {
            placeholder: '请输入您的密码',
            isRequired: true
        }
    },
    signUp: {
        username: {
            placeholder: '请输入您的用户名',
            isRequired: true
        },
        password: {
            placeholder: '请输入您的密码',
            isRequired: true
        },
        confirm_password: {
            placeholder: '请再次输入您的密码',
            isRequired: true
        }
    }
  }

const AuthPage: React.FC = () => {
    const services = {
        async handleSignIn(formData: any): Promise<SignInOutput> {
            try {
                const signInResult = await signIn(
                    {
                        username: formData.username,
                        password: formData.password,
                    }
                )
                return signInResult
            } catch (error) {
                console.error('Error signing in', error);
                // Handle error, possibly show an error message
                throw error;
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Authenticator formFields={formFields} services={services} hideSignUp={true}>
            </Authenticator>
        </div>
    );
}

export default AuthPage;