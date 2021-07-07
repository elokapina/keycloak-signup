import * as dotenv from "dotenv"
dotenv.config()

import * as bodyParser from "body-parser"
import * as express from "express"
import * as nunjucks from "nunjucks"
import config from "./config"
import { PagesTable } from "./database/tables"
import { createPage, IPage } from "./pages"
import { getDatabaseConnection } from "./database/database"
import { setupDatabase } from "./database/database"

const app = express()
const port = 3000
app.use(express.static('public'))
app.use(bodyParser.json())

nunjucks.configure("views", {
    autoescape: true,
    express: app
})

setupDatabase()
    .then(() => {
        console.log("Successfully setup database")
    })
    .catch(err => {
        console.error("Error setting up database", err)
        throw err
    })

app.post('/api/pages', async(req, res) => {
    const token = req.body.token
    if (token !== config.secretToken) {
        return res.status(403).send({})
    }
    const creator = req.body.creator
    if (!creator) {
        return res.status(400).send({
            error: "Must supply a creator"
        })
    }

    let page: IPage
    try {
        page = await createPage(creator)
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            error: "Failed to create page"
        })
    }
    console.log(`Created page with token ${page.signup_token}`)
    res.send(page)
})

app.get('/health', (_req, res) => {
    res.send('OK')
})

app.get('/:pageId([A-Z]{6})', async(req, res) => {
    const dbClient = getDatabaseConnection()
    const pages = await dbClient.query(
        // TODO also check validity and signup counts
        PagesTable.select("*", ["signup_token"])([req.params.pageId])
    )
    if (pages.length === 0) {
        return res.render('shrug.html')
    }
    console.log(`Rendering page ${req.params.pageId}`)
    res.render('page.html', pages[0])
})

app.post('/:pageId([A-Z]{6})', async(req, res) => {
    const dbClient = getDatabaseConnection()
    const pages = await dbClient.query(
        // TODO also check validity and signup counts
        PagesTable.select("*", ["signup_token"])([req.params.pageId])
    )
    if (pages.length === 0) {
        return res.status(404).send({})
    }
    console.log(`Signup via token ${req.params.pageId}`)
    // TODO do actual account creation
    return res.send({})
})

app.listen(port, () => {
    console.log(`Listening at http://0.0.0.0:${port}`)
})
