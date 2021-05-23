import { Pool, Result } from "pg"

const pool = new Pool()

export function query(text: string, params: string|number): Result {
    return pool.query(text, params)
}
