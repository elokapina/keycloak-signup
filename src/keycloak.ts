import KcAdminClient from "keycloak-admin"
import UserRepresentation from "keycloak-admin/lib/defs/userRepresentation"
import config from "./config"
import { RequiredActionAlias } from "keycloak-admin/lib/defs/requiredActionProviderRepresentation"
import { UserQuery } from "keycloak-admin/lib/resources/users"

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
        emailVerified: true,
        enabled: true,
    })
    return response.id
}

export async function getUsers(options: UserQuery): Promise<UserRepresentation[]> {
    const client = await getClient()
    return client.users.find({
        realm: config.keycloak.realm,
        ...options,
    })
}

export async function sendPasswordReset(userId: string): Promise<void> {
    const client = await getClient()
    await client.users.executeActionsEmail({
        realm: config.keycloak.realm,
        id: userId,
        // TODO make configurable
        lifespan: 1800,
        actions: [RequiredActionAlias.UPDATE_PASSWORD],
    })
}
