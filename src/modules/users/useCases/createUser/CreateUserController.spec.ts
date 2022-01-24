import { app } from '../../../../app'
import createConnection from '../../../../database/index'
import { Connection } from "typeorm"
import request from 'supertest'

let connection: Connection
let usersEndpoint = '/api/v1/users'
let mockUser = {
    name: 'fake user',
    email: 'fake@mail.com',
    password: 'fake password'
}

describe('POST /users', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be able to create a user', async () => {
        const response = await request(app)
            .post(usersEndpoint)
            .send(mockUser)

        expect(response).toHaveProperty('status', 201)
    })

    it('should not be able to create two users with the same email', async () => {
        await request(app).post(usersEndpoint).send(mockUser)

        const response = await request(app).post(usersEndpoint).send({
            email: mockUser.email,
            name: 'another fake user',
            password: 'another_fake_password'
        })

        expect(response).toHaveProperty('status', 400)
    })
})
