import * as express from "express"
import config from "./config"
import { createPage, IPage } from "./pages"

const app = express()
const port = 3000
app.use(express.static('public'))

app.post('/pages', async(req, res) => {
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
        return res.status(500).send({
            error: "Failed to create page"
        })
    }

    res.send(page)
})

app.get('/health', (_req, res) => {
    res.send('OK')
})

app.listen(port, () => {
    console.log(`Listening at http://0.0.0.0:${port}`)
})
