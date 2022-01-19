import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository"
import { CreateUserError } from "./CreateUserError"
import { CreateUserUseCase } from "./CreateUserUseCase"

let createUserUseCase: CreateUserUseCase
let createUserRepositoryInMemory: InMemoryUsersRepository

describe('CreateUser UseCase', () => {
    beforeEach(() => {
        createUserRepositoryInMemory = new InMemoryUsersRepository()
        createUserUseCase = new CreateUserUseCase(createUserRepositoryInMemory)
    })

    it('should create a user if data is correct', async () => {
        const userData = {
            name: 'fake name',
            password: 'fake password',
            email: 'fake@mail.com'
        }

        const user = await createUserUseCase.execute(userData)

        expect(user).toHaveProperty('email', 'fake@mail.com')
    })

    it('should throw an error if user already exists', async () => {
        const userData = {
            name: 'fake name',
            password: 'fake password',
            email: 'fake@mail.com'
        }

        await createUserUseCase.execute(userData)

        await expect(
            createUserUseCase.execute(userData)
        ).rejects.toBeInstanceOf(CreateUserError)
    })
})
