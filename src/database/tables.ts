import { DatabaseV1 } from "./versions/SchemaV1"
import { Table } from "postgres-schema-builder"

export const Tables = DatabaseV1

export const PagesTable = Table(Tables, "pages")
