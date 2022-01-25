// server.get("/", async (req, res) => res.json('Hello from W2E'))
// export { server }
import server from 'backend/server'
import supertest from 'supertest'

const req = supertest(server)

test('basic select', async (done) => {
    const res = await req.post(`/select`)

    expect(res.status).toBe(203)
}, 30000)

test('basic insert', async (done) => {
    const res = await req.get(`/dbtest/mysql`)
    const allResults = res.body

    expect(allResults.ping).toBe(true)
}, 30000)