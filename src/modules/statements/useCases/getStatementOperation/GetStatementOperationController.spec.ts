
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

async function buildStatement(operation: string, amount: number, description: string, token: string) {
    const response = await request(app)
        .post(`${statementsBaseEndpoint}/${operation}`)
        .set({
            Authorization: `Bearer ${token}`
        })
        .send({
            amount,
            description
        })

    return response.body
}

describe('GET /statements/:statement_id', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should return the correct statement info', async () => {
        await buildUser('fake user', 'fake@mail.com', 'admin')

        const { token } = await authenticateUser('fake@mail.com', 'admin')

        const statement = await buildStatement('deposit', 150.00, 'fake deposit', token)

        const response = await request(app)
            .get(`${statementsBaseEndpoint}/${statement.id}`)
            .set({
                Authorization: `Bearer ${token}`
            })

        console.log(response)

        expect(response).toHaveProperty('status', 200)
        expect(response.body).toMatchObject({
            id: expect.stringMatching(uuidPattern),
            user_id: expect.stringMatching(uuidPattern),
            description: 'fake deposit',
            amount: "150.00",
            type: 'deposit',
            created_at: expect.stringMatching(timestampPattern),
            updated_at: expect.stringMatching(timestampPattern)
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