interface Config {
    keycloak: {
        baseUrl: string;
        clientId: string;
        password: string;
        realm: string;
        username: string;
    }
}

const config: Config = {
    keycloak: {
        baseUrl: process.env.KEYCLOAK_BASE_URL,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        password: process.env.KEYCLOAK_PASSWORD,
        realm: process.env.KEYCLOAK_REALM,
        username: process.env.KEYCLOAK_USERNAME,
    }
}

export default config;
