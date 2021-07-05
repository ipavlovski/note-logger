import supertest from 'supertest'

import { server } from '../src/server'
import { router } from '../src/api'
import { serverPort } from '../src/config'

console.log(`Starting testing on port ${serverPort}`)

server.use(router)
const req = supertest(server)

test('GET /', async done => {
    const expectedMessage = 'Server is running!'
    
    const res = await req.get(`/`)
    expect(res.body).toBe(expectedMessage)
    done()
})

test('GET /route1', async done => {
    const expectedMessage = 'hello from route1'

    const res = await req.get(`/route1`)
    expect(res.body).toBe(expectedMessage)
    done()
})

test('GET /route2', async done => {
    const expectedMessage = 'hello from route2'

    const res = await req.get(`/route2`)
    expect(res.body).toBe(expectedMessage)
    done()
})
