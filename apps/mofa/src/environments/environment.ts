export const environment = {
    production: false,
    baseURL: 'https://agentsapi.nfinyx.ai',
    // nfinyx Platform API = identity provider (and ReviewHub host). Employees sign in here and the
    // token is accepted by the agent backends and ReviewHub. Remove to fall back to the agents
    // backend's own /auth/token login (only while HR_AGENT still has LOCAL_LOGIN_ENABLED=true).
    platformApiUrl: 'https://api.nfinyx.ai/platform/api/v1',
    RSA: {
        publicKey: '',
        privateKey: '',
    },
    enableProxy: false,
    enableOtpLogin: false,
    appId: 'mofa',
};
