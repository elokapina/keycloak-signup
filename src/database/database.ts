import config from "../config"
import {
    DatabaseClient, DatabaseSchema, composeCreateTableStatements, IDatabaseClient,
} from "postgres-schema-builder"
import { Pool } from "pg"
import { Tables } from "./tables"
import { Migrations } from "./migrations"

let dbConnection: IDatabaseClient = null

export function getDatabaseConnection(): IDatabaseClient {
    if (dbConnection) {
        return dbConnection
    }
    dbConnection = DatabaseClient(
        new Pool({
            host: config.database.host,
            port: Number.parseInt(config.database.port),
            user: config.database.user,
            password: config.database.password,
            database: config.database.name,
        }),
    )
    return dbConnection
}

export async function setupDatabase(): Promise<void> {
    const database = getDatabaseConnection()

    const migrations = Migrations()

    const schema = DatabaseSchema({
        client: database,
        name: config.database.name,
        createStatements: composeCreateTableStatements(Tables),
        migrations,
        views: [],
    })

    await schema.init()
    await schema.migrateLatest()
}
