import { CreateUserController } from "./CreateUserController"
import { app } from '../../../../app'
import createConnection from '../../../../database/index'
import { Connection } from "typeorm"
import request from 'supertest'

let connection: Connection
let endpoint = '/api/v1/users'

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
            .post(endpoint)
            .send({
                name: 'fake user',
                email: 'fake@mail.com',
                password: 'fake password'
            })

        expect(response).toHaveProperty('status', 201)
        expect(response).toHaveProperty('body')
    })
})
