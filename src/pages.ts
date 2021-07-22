import config from "./config"
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

export async function createPage(creator: string, maxSignups: number, validDays: number): Promise<IPage> {
    const signupToken = await generateSignupToken()
    const adminToken = uuidv4()
    const page = {
        admin_token: adminToken,
        created_by: creator,
        max_signups: maxSignups,
        signup_token: signupToken,
        valid_from: DateTime.utc(),
        valid_to: DateTime.utc().plus({ days: validDays }),
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
        return res.render(
            'expired.html', {
                title: config.title,
            },
        )
    }
    const currentTime = DateTime.utc()
    if (currentTime < page.valid_from || currentTime > page.valid_to) {
        return res.render(
            'expired.html', {
                title: config.title,
            },
        )
    }

    console.log(`Rendering page ${req.params.pageId}`)
    const requestToken = generateStrings.generate({ length: 32 });
    requestTokens.push(requestToken);
    return res.render('page.html', {
        ...pages[0],
        requestToken,
        style: config.style,
        successRedirect: config.successRedirect,
        timestamp: new Date().getTime(),
        title: config.title,
        welcomeText: config.welcomeText,
    })
}

export async function pageRegister(req: Request, res: Response): Promise<Response> {
    if (requestTokens.indexOf(req.body.requestToken) === -1) {
        return res.status(403).send({})
    }

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
    let usernameUsers
    try {
        usernameUsers = await getUsers({ username: req.body.username })
    } catch (error) {
        console.error(`Failed to look for similar users from keycloak`, error)
        return res.status(500).send({ error: 'Unknown error creating user account' })
    }
    for (const user of usernameUsers) {
        if (user.username === req.body.username) {
            console.log('Found existing user with same username')
            return res.status(400).send({error: 'This username is already reserved'})
        }
    }
    let emailUsers
    try {
        emailUsers = await getUsers({ email: req.body.email })
    } catch (error) {
        console.error(`Failed to fetch user by email from keycloak`, error)
        return res.status(500).send({ error: 'Unknown error creating user account' })
    }
    for (const user of emailUsers) {
        if (user.email === req.body.email) {
            console.log('Found existing user with same email')
            return res.status(400).send({
                error: 'This email is already reserved',
                errorCode: 'E_EMAIL_EXISTS',
                keycloakUrl: `${config.keycloak.baseUrl}/realms/${config.keycloak.realm}/account`,
            })
        }
    }
    console.log("Trying to create!")

    let userId
    try {
        userId = await createUser(req.body.username, req.body.email)
    } catch (error) {
        console.error(`Failed to create user`, error)
        return res.status(500).send({ error: 'Unknown error creating user account' })
    }
    if (!userId) {
        console.warn(`Failed to get userId back from keycloak user creation for ${req.body.username}`)
        return res.status(500).send({ error: 'Unknown error creating user account' })
    }

    console.log(`User ${userId} created successfully`)
    requestTokens.splice(requestTokens.indexOf(req.body.requestToken), 1);

    try {
        await sendPasswordReset(userId)
    } catch (error) {
        console.error(`Failed to send password reset`, error)
        return res.status(500).send({ error: 'Unknown error creating user account' })
    }
    console.log(`User ${userId} password reset sent`)

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
