import { PagesTable } from "./database/tables"

export interface IPage {
    valid_from: Date
    valid_to: Date
    signup_token: string
    admin_token: string
    max_signups: number
    signups_done: number
    created_by: string
}

export async function createPage(creator: string): Promise<IPage> {
    const query = PagesTable.insertFromObj({
        // TODO add stuff
    })
    // TODO run sql, return page
}
