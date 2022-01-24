import request from 'supertest'
import { Connection } from 'typeorm'
import createConnection from '../../../../database/index'
import { app } from '../../../../app'
import { v4 as uuid } from 'uuid'
import { hash } from 'bcryptjs'

let profileEndpoint = '/api/v1/profile'
let connection: Connection
let mockUser = {
    name: 'fake user show profile',
    email: 'fake_show_profile@mail.com',
    password: 'fake password'
}

async function createUser(name: string, email: string, rawPassword: string) {
    const id = uuid()
    const hashedPassword = await hash(rawPassword, 8)

    await connection.query(
        `INSERT INTO users (id, name, email, password, created_at, updated_at)
        VALUES ('${id}', '${name}', '${email}', '${hashedPassword}', 'now()', 'now()')`
    )
}

async function authenticateAndGetUserToken(email: string, rawPassword: string) {
    const response = await request(app)
        .post('/api/v1/sessions')
        .send({
            email,
            password: rawPassword
        })

    return response.body.token
}

describe('GET /profile', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    })

    afterAll(async () => {
        connection.dropDatabase()
        connection.close()
    })

    it('returns 401 if user is not authenticated', async () => {
        const response = await request(app).get(profileEndpoint)

        expect(response).toHaveProperty('status', 401)
    })

    it('returns the user that is authenticated', async () => {
        const { name, email, password } = mockUser

        await createUser(name, email, password)
        const token = await authenticateAndGetUserToken(email, password)

        const response = await request(app)
            .get(profileEndpoint)
            .set({
                Authorization: `Bearer ${token}`
            })

        expect(response).toHaveProperty('status', 200)
        expect(response).toHaveProperty('body')
        expect(response.body).toHaveProperty('name', mockUser.name)
    })
})
