import { IMigration } from "postgres-schema-builder"

/*
    Docs on how migrations work can be found here:
    https://github.com/yss14/postgres-schema-builder
*/

export function Migrations(): Map<number, IMigration> {
    return new Map<number, IMigration>()
}
