import { Connection } from "typeorm"
import createConnection from '../../../../database/index'
import request from 'supertest'
import { app } from '../../../../app'

let connection: Connection
let balanceEndpoint = '/api/v1/statements/balance'

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

async function buildStatement(
    operation: string,
    amount: number,
    description: string,
    token: string
) {
    return await request(app)
        .post(`/api/v1/statements/${operation}`)
        .set({
            Authorization: `Bearer ${token}`
        })
        .send({
            amount,
            description
        })
}

describe('GET /statements/balance', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should return the total balance if there is a single statement', async () => {
        await buildUser('fake user', 'fake@mail.com', 'admin')

        const { token } = await authenticateUser('fake@mail.com', 'admin')

        await buildStatement('deposit', 150.00, 'fake statement', token)

        const response = await request(app)
            .get(balanceEndpoint)
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response).toHaveProperty('status', 200)
        expect(response.body).toHaveProperty('balance', 150.00)
        expect(response.body.statement).toHaveLength(1)
    })

    it('should return the correct balance when there are multiple statements', async () => {
        await buildUser('another fake user', 'anotherfake@mail.com', 'admin')

        const { token } = await authenticateUser('anotherfake@mail.com', 'admin')

        await buildStatement('deposit', 150.00, 'fake deposit', token)
        await buildStatement('withdraw', 50.00, 'fake withdraw', token)

        const response = await request(app)
            .get(balanceEndpoint)
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response.body).toHaveProperty('balance', 100.00)
        expect(response.body.statement).toHaveLength(2)
    })

    it('should not return the balance if no token is passed in headers', async () => {
        await buildUser('valid user', 'valid_user@mail.com', 'admin')
        const { token } = await authenticateUser('valid_user@mail.com', 'admin')
        await buildStatement('deposit', 150.00, 'fake deposit', token)
        await buildStatement('withdraw', 50.00, 'fake withdraw', token)

        const response = await request(app)
            .get(balanceEndpoint)

        expect(response).toHaveProperty('status', 401)
    })
})