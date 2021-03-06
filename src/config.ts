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
        clientSecret: string
        grantType: string
        password: string
        realm: string
        username: string
    }
    maxSignupsDefault: number
    secretToken: string
    style: {
        heroBackgroundColor: string
        pageBackgroundColor: string
        primaryButtonBackgroundColor: string
    }
    successRedirect: string
    title: string
    validDaysDefault: number
    welcomeText: string
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
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        grantType: process.env.KEYCLOAK_GRANT_TYPE,
        password: process.env.KEYCLOAK_PASSWORD,
        realm: process.env.KEYCLOAK_REALM,
        username: process.env.KEYCLOAK_USERNAME,
    },
    maxSignupsDefault: Number.parseInt(process.env.KEYCLOAK_SIGNUP_MAX_SIGNUPS_DEFAULT || '50'),
    secretToken: process.env.KEYCLOAK_SIGNUP_SECRET_TOKEN,
    style: {
        heroBackgroundColor: process.env.KEYCLOAK_SIGNUP_STYLE_HERO_BACKGROUND_COLOR,
        pageBackgroundColor: process.env.KEYCLOAK_SIGNUP_STYLE_PAGE_BACKGROUND_COLOR,
        primaryButtonBackgroundColor: process.env.KEYCLOAK_SIGNUP_STYLE_PRIMARY_BUTTON_BACKGROUND_COLOR,
    },
    successRedirect: process.env.KEYCLOAK_SIGNUP_SUCCESS_REDIRECT,
    title: process.env.KEYCLOAK_SIGNUP_TITLE,
    validDaysDefault: Number.parseInt(process.env.KEYCLOAK_SIGNUP_VALID_DAYS_DEFAULT || '3'),
    welcomeText: process.env.KEYCLOAK_SIGNUP_WELCOME_TEXT
}

export default config
