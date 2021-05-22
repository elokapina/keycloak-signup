import KcAdminClient from "keycloak-admin"
import config from "./config"

let keycloakClient: KcAdminClient

async function getClient(): Promise<KcAdminClient> {
    if (!keycloakClient) {
        keycloakClient = new KcAdminClient({
            baseUrl: config.keycloak.baseUrl,
        })
        await keycloakClient.auth({
          username: config.keycloak.username,
          password: config.keycloak.password,
          grantType: 'password',
          clientId: config.keycloak.clientId,
        })
    }
    return keycloakClient
}

export async function createUser(username: string, email: string): Promise<string> {
    const client = await getClient()
    const response = await client.users.create({
      realm: config.keycloak.realm,
      username,
      email,
    })
    return response.id
}
