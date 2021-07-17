import * as generateStrings from "generate-strings"
import { DateTime } from "luxon"
import { PagesTable } from "./database/tables"
import { Request, Response } from "express"
import { SQL } from "postgres-schema-builder"
import { createUser, getUsers, sendPasswordReset } from "./keycloak"
import { getDatabaseConnection } from "./database/database"
import { v4 as uuidv4 } from "uuid"

const requestTokens = [];

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

export async function renderPage(req: Request, res: Response): Promise<Response> {
    const dbClient = getDatabaseConnection()
    const pages = await dbClient.query(
        PagesTable.select("*", ["signup_token"])([req.params.pageId])
    )
    if (pages.length === 0) {
        return res.render('shrug.html')
    }
    const page = pages[0]

    if (page.signups_done >= page.max_signups) {
        return res.render('shrug.html')
    }
    const currentTime = DateTime.utc()
    if (currentTime < page.valid_from || currentTime > page.valid_to) {
        return res.render('shrug.html')
    }

    console.log(`Rendering page ${req.params.pageId}`)
    const requestToken = generateStrings.generate({ length: 32 });
    requestTokens.push(requestToken);
    return res.render('page.html', {
        ...pages[0],
        requestToken,
        timestamp: new Date().getTime(),
    })
}

export async function pageRegister(req: Request, res: Response): Promise<Response> {
    if (requestTokens.indexOf(req.body.requestToken) === -1) {
        return res.status(403).send({})
    }
    requestTokens.splice(requestTokens.indexOf(req.body.requestToken), 1);

    const dbClient = getDatabaseConnection()
    const pages = await dbClient.query(
        PagesTable.select("*", ["signup_token"])([req.params.pageId])
    )
    if (pages.length === 0) {
        return res.status(404).send({})
    }
    const page = pages[0]

    if (page.signups_done >= page.max_signups) {
        return res.status(403).send({
            error: "This signup page has already had the maximum amount of signups.",
        })
    }
    const currentTime = DateTime.utc()
    if (currentTime < page.valid_from || currentTime > page.valid_to) {
        return res.status(403).send({
            error: "This signup page has expired.",
        })
    }

    console.log(`Signup via token ${req.params.pageId}`)

    // Check if username or email exists
    // keycloak-admin library doesn't support the `exact` query parameter, so we
    // need to look for exact matches here.
    // TODO patch to upstream
    const usernameUsers = await getUsers({ username: req.body.username })
    for (const user of usernameUsers) {
        if (user.username === req.body.username) {
            console.log('Found existing user with same username')
            return res.status(400).send({error: 'This username is already reserved'})
        }
    }
    const emailUsers = await getUsers({ email: req.body.email })
    for (const user of emailUsers) {
        if (user.email === req.body.email) {
            console.log('Found existing user with same email')
            return res.status(400).send({error: 'This email is already reserved'})
        }
    }
    console.log("Trying to create!")

    const userId = await createUser(req.body.username, req.body.email)
    if (!userId) {
        return res.status(400).send({ error: 'Unknown error creating user account' })
    }
    await sendPasswordReset(userId)
    console.log(`User ${userId} created successfully, password reset sent`)

    // Update counter
    const query = SQL.raw(
        `UPDATE ${PagesTable.name}
            SET signups_done = (
                SELECT signups_done from ${PagesTable.name} where id = $1
            ) + 1
            WHERE id = $2;`,
        [page.id, page.id],
    );
    await dbClient.query(query);

    return res.send({ userId })
}
