import { app } from '../../../../app'
import createConnection from '../../../../database/index'
import request from 'supertest'
import { Connection } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { hash } from 'bcryptjs'

let sessionsEndpoint = '/api/v1/sessions'
let connection: Connection

describe('POST /sessions', () => {
    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    })

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should the user data with a jwt', async () => {
        const id = uuid()
        const password = await hash('admin', 8)

        await connection.query(
            `INSERT INTO users (id, name, email, password, created_at, updated_at)
            VALUES ('${id}', 'fake_user', 'fake@mail.com', '${password}', 'now()', 'now()')`
        )

        const response = await request(app)
            .post(sessionsEndpoint)
            .send({
                email: 'fake@mail.com',
                password: 'admin'
            })

        const jwtPattern = new RegExp(/^[A-Za-z0-9]+\.[A-Za-z0-9]+\.[A-Za-z0-9]+$/)
        expect(response).toHaveProperty('status', 200)
        expect(response).toHaveProperty('body')
        expect(response.body).toHaveProperty('token')
        expect(response.body.token).toMatch(jwtPattern)
    })
})
