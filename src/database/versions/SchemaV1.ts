/* eslint-disable @typescript-eslint/no-namespace */
import { ColumnType, NativeFunction, TableSchema } from "postgres-schema-builder"

export namespace DatabaseV1 {
    const baseSchema = TableSchema({
        id: { type: ColumnType.BigInt, primaryKey: true, autoIncrement: true },
        created: { type: ColumnType.TimestampTZ, nullable: false, defaultValue: { func: NativeFunction.Now } },
        modified: { type: ColumnType.TimestampTZ, nullable: true },
    })

    export const pages = TableSchema({
        ...baseSchema,
        valid_from: { type: ColumnType.TimestampTZ, nullable: false, defaultValue: { func: NativeFunction.Now } },
        valid_to: { type: ColumnType.TimestampTZ, nullable: false },
        signup_token: { type: ColumnType.Varchar, nullable: false },
        admin_token: { type: ColumnType.Varchar, nullable: false },
        max_signups: { type: ColumnType.Integer, nullable: false },
        signups_done: { type: ColumnType.Integer, nullable: false, defaultValue: 0 },
        created_by: { type: ColumnType.Varchar, nullable: false },
    })
}
