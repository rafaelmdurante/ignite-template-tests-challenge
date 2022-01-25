import { Connection } from "typeorm"
import createConnection from '../../../../database/index'
import request from 'supertest'
import { app } from '../../../../app'

let connection: Connection
let statementsBaseEndpoint = '/api/v1/statements'

let uuidPattern = new RegExp(/^[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}$/)
let timestampPattern = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

async function buildUser(name: string, email: string, password: string) {
    return await request(app).post('/api/v1/users').send({
        name,
        email,
        password
    })
}

async function authenticateUser(email: string, password: string) {
    const response = await request(app)
        .post('/api/v1/sessions')
        .send({ email, password })

    return response.body
}

describe('GET /statements/<operation>', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should create a deposit and return its information', async () => {
        await buildUser('fake user', 'fake@mail.com', 'admin')

        const { token } = await authenticateUser('fake@mail.com', 'admin')

        const response = await request(app)
            .post(`${statementsBaseEndpoint}/deposit`)
            .set({
                Authorization: `Bearer ${token}`
            })
            .send({
                amount: 150.00,
                description: 'fake deposit'
            })

        expect(response).toHaveProperty('status', 201)
        expect(response.body).toMatchObject({
            id: expect.stringMatching(uuidPattern),
            user_id: expect.stringMatching(uuidPattern),
            type: 'deposit',
            amount: 150.00,
            description: 'fake deposit',
            created_at: expect.stringMatching(timestampPattern),
            updated_at: expect.stringMatching(timestampPattern)
        })
    })

    it('should create a withdraw and return its information', async () => {
        await buildUser('another fake user', 'anotherfake@mail.com', 'admin')

        const { token } = await authenticateUser('anotherfake@mail.com', 'admin')

        await request(app)
            .post(`${statementsBaseEndpoint}/deposit`)
            .set({
                Authorization: `Bearer ${token}`
            })
            .send({
                amount: 100.00,
                description: 'fake deposit'
            })

        const response = await request(app)
            .post(`${statementsBaseEndpoint}/withdraw`)
            .set({
                Authorization: `Bearer ${token}`
            })
            .send({
                amount: 50.00,
                description: 'fake withdraw'
            })

        expect(response).toHaveProperty('status', 201)
        expect(response.body).toMatchObject({
            id: expect.stringMatching(uuidPattern),
            user_id: expect.stringMatching(uuidPattern),
            type: 'withdraw',
            amount: 50.00,
            description: 'fake withdraw',
            created_at: expect.stringMatching(timestampPattern),
            updated_at: expect.stringMatching(timestampPattern)
        })
    })

    it('should return 400 if there are insufficient funds to withdraw', async () => {
        await buildUser('insufficient funds user', 'insufficient@mail.com', 'admin')

        const { token } = await authenticateUser('insufficient@mail.com', 'admin')

        const response = await request(app)
            .post(`${statementsBaseEndpoint}/withdraw`)
            .set({
                Authorization: `Bearer ${token}`
            })
            .send({
                amount: 50.00,
                description: 'fake withdraw'
            })

        expect(response).toMatchObject({
            status: 400,
            error: {
                text: JSON.stringify({ message: 'Insufficient funds' })
            }
        })
    })

    it('should return 401 if no token is passed', async () => {
        const response = await request(app)
            .post(`${statementsBaseEndpoint}/withdraw`)
            .send({
                amount: 50.0,
                description: 'fake withdraw'
            })

        expect(response).toHaveProperty('status', 401)
    })
})