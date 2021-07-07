import * as generateStrings from "generate-strings"
import { DateTime } from "luxon"
import { PagesTable } from "./database/tables"
import { getDatabaseConnection } from "./database/database"
import { v4 as uuidv4 } from "uuid"

const tokenConfig = {
    length: 6,
    upperCase: true,
    lowerCase: false,
    special: false,
    number: false,
}

export interface IPage {
    admin_token: string
    created_by: string
    max_signups: number
    signup_token: string
    signups_done?: number
    valid_from: Date
    valid_to: Date
}

async function generateSignupToken(): Promise<string|null> {
    const dbClient = getDatabaseConnection()
    let unusedToken
    while (!unusedToken) {
        const token = generateStrings.generate(tokenConfig)
        const query = PagesTable.select(["id"], ["signup_token"])([token])
        let page
        try {
            page = await dbClient.query(query)
        } catch (err) {
            console.error(err)
        }
        if (page.length === 0) {
            return token
        }
    }
    return null
}

export async function createPage(creator: string): Promise<IPage> {
    const signupToken = await generateSignupToken()
    const adminToken = uuidv4()
    const page = {
        admin_token: adminToken,
        created_by: creator,
        // TODO make configurable or depending on type of command to create page
        max_signups: 50,
        signup_token: signupToken,
        valid_from: DateTime.utc(),
        // TODO make configurable or based on command parameters
        valid_to: DateTime.utc().plus({ days: 3 }),
    }
    const query = PagesTable.insertFromObj(page)
    const dbConnection = getDatabaseConnection()
    await dbConnection.query(query)
    console.log(`Successfully created a page with signup token ${signupToken}`)
    return page
}
