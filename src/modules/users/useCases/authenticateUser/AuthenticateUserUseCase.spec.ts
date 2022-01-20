import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "../createUser/CreateUserUseCase"
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase"
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError"

let usersRepositoryInMemory: InMemoryUsersRepository
let authenticateUserUseCase: AuthenticateUserUseCase
let createUserUseCase: CreateUserUseCase

describe('AuthenticateUser UseCase', () => {
    beforeEach(() => {
        usersRepositoryInMemory = new InMemoryUsersRepository()
        authenticateUserUseCase = new AuthenticateUserUseCase(
            usersRepositoryInMemory
        )
        createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
    })

    it('should throw incorrect email or password if email not found', async () => {
        const loginDetails = {
            email: 'fake@mail.com',
            password: 'fake_password'
        }

        await expect(
            authenticateUserUseCase.execute(loginDetails)
        ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
    })

    it('should throw incorrect email or password if password does not match', async () => {
        await createUserUseCase.execute({
            email: 'fake@mail.com',
            name: 'fake user',
            password: 'correct password'
        })

        await expect(
            authenticateUserUseCase.execute({
                email: 'fake@mail.com',
                password: 'incorrect password'
            })
        ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
    })

    it('should return a user with id, name, email and a token', async () => {
        const user = {
            email: 'fake@mail.com',
            name: 'fake user',
            password: 'correct password'
        }

        await createUserUseCase.execute(user)

        const response = await authenticateUserUseCase.execute({
            email: user.email,
            password: user.password
        })

        expect(response).toHaveProperty('token')
    })
})
