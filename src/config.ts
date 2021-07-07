interface Config {
    database: {
        name: string
        password: string
        port: string
        user: string
        host: string
    }
    keycloak: {
        baseUrl: string
        clientId: string
        password: string
        realm: string
        username: string
    }
    secretToken: string
}

const config: Config = {
    database: {
        name: process.env.DATABASE_NAME,
        password: process.env.DATABASE_PASSWORD,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        host: process.env.DATABASE_HOST,
    },
    keycloak: {
        baseUrl: process.env.KEYCLOAK_BASE_URL,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        password: process.env.KEYCLOAK_PASSWORD,
        realm: process.env.KEYCLOAK_REALM,
        username: process.env.KEYCLOAK_USERNAME,
    },
    secretToken: process.env.KEYCLOAK_SIGNUP_SECRET_TOKEN,
}

export default config
