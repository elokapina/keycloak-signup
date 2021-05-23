import * as express from "express"

const app = express()
const port = 3000
app.use(express.static('public'))

app.get('/health', (_req, res) => {
    res.send('OK')
})

app.listen(port, () => {
    console.log(`Listening at http://0.0.0.0:${port}`)
})
