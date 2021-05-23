import {
    DatabaseClient, DatabaseSchema, composeCreateTableStatements, IDatabaseClient, IDatabaseSchema,
} from "postgres-schema-builder"
import { Pool } from "pg"
import { Tables } from "./tables"
import { Migrations } from "./migrations"

export async function connectAndSetupDatabase(): Promise<Record<string, IDatabaseClient|IDatabaseSchema>> {
    const database = DatabaseClient(
		new Pool(),
	)

	const migrations = Migrations()

	const schema = DatabaseSchema({
		client: database,
		name: process.env.PGDATABASE,
		createStatements: composeCreateTableStatements(Tables),
		migrations,
        views: [],
	})

	await schema.init()
	await schema.migrateLatest()

	return { database, schema }
}
