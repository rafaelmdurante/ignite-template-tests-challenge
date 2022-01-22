import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase"
import { OperationType } from "../../entities/Statement"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { CreateStatementError } from "./CreateStatementError"
import { CreateStatementUseCase } from "./CreateStatementUseCase"

let sut: CreateStatementUseCase
let usersRepository: InMemoryUsersRepository
let statementsRepository: InMemoryStatementsRepository
let createUserUseCase: CreateUserUseCase

async function buildUser() {
    return await createUserUseCase.execute({
        name: 'fake valid user',
        email: 'fake@mail.com',
        password: 'fake_password'
    })
}

describe('CreateStatement UseCase', () => {
    beforeEach(() => {
        usersRepository = new InMemoryUsersRepository()
        statementsRepository = new InMemoryStatementsRepository()
        sut = new CreateStatementUseCase(usersRepository, statementsRepository)
        createUserUseCase = new CreateUserUseCase(usersRepository)
    })

    it('should throw UserNotFound if user does not exist', async () => {
        await expect(
            sut.execute({
                user_id: 'user does not exist',
                amount: 100.00,
                type: OperationType.DEPOSIT,
                description: 'fake statement'
            })
        ).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
    })

    it('should throw InsufficientFunds if balance is less than amount', async () => {
        const user = await buildUser()

        await expect(
            sut.execute({
                user_id: user.id as string,
                amount: 100.00,
                type: OperationType.WITHDRAW,
                description: 'fake statement'
            })
        ).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
    })

    it('should be able to create a deposit', async () => {
        const user = await buildUser()

        const deposit = await sut.execute({
            user_id: user.id as string,
            type: OperationType.DEPOSIT,
            amount: 150.00,
            description: 'fake statement'
        })

        expect(deposit).toMatchObject({
            type: 'deposit',
            amount: 150.00,
        })
    })

    it('should be able to create a withdraw', async () => {
        const user = await buildUser()

        await sut.execute({
            user_id: user.id as string,
            type: OperationType.DEPOSIT,
            amount: 150.00,
            description: 'fake statement'
        })

        const withdraw = await sut.execute({
            user_id: user.id as string,
            type: OperationType.WITHDRAW,
            amount: 50.00,
            description: 'fake statement'
        })

        expect(withdraw).toMatchObject({
            type: 'withdraw',
            amount: 50.00,
        })
    })
})

