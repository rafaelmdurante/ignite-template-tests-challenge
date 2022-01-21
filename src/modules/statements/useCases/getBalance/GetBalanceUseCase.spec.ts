import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase"
import { GetBalanceError } from "./GetBalanceError"
import { GetBalanceUseCase } from "./GetBalanceUseCase"
import { OperationType } from '../../entities/Statement'

let getBalanceUseCase: GetBalanceUseCase
let statementsRepository: InMemoryStatementsRepository
let usersRepository: InMemoryUsersRepository
let createUserUseCase: CreateUserUseCase
let createStatementUseCase: CreateStatementUseCase

const fakeUser = {
    name: 'fake user',
    email: 'fake@mail.com',
    password: 'fake password'
}

async function buildStatement(userId: string, type: OperationType, amount: number) {
    await createStatementUseCase.execute({
        user_id: userId as string,
        type,
        amount,
        description: 'fake statement'
    })
}

describe('GetBalance UseCase', () => {
    beforeEach(() => {
        statementsRepository = new InMemoryStatementsRepository()
        usersRepository = new InMemoryUsersRepository()
        createUserUseCase = new CreateUserUseCase(usersRepository)
        createStatementUseCase = new CreateStatementUseCase(
            usersRepository, statementsRepository
        )
        getBalanceUseCase = new GetBalanceUseCase(
            statementsRepository, usersRepository
        )
    })

    it('should throw GetBalanceError if no user is found', async () => {
        await expect(
            getBalanceUseCase.execute({ user_id: 'unexistent user' })
        ).rejects.toBeInstanceOf(GetBalanceError)
    })

    it('should return zero for balance and an empty array if user has no statements', async () => {
        const user = await createUserUseCase.execute(fakeUser)

        const balance = await getBalanceUseCase.execute({
            user_id: user.id as string
        })

        expect(balance).toEqual({
            statement: [],
            balance: 0
        })
    })

    it('should return a list of statements and total balance', async () => {
        const user = await createUserUseCase.execute(fakeUser)
        await buildStatement(user.id as string, OperationType.DEPOSIT, 150.00)

        const balance = await getBalanceUseCase.execute({
            user_id: user.id as string
        })

        expect(balance).toMatchObject({
            balance: 150,
            statement: [
                {
                    amount: 150,
                    description: 'fake statement',
                    type: 'deposit'
                }
            ]
        })
    })

    it('should return a list of statements and total balance', async () => {
        const user = await createUserUseCase.execute(fakeUser)

        await buildStatement(user.id as string, OperationType.DEPOSIT, 250.00)
        await buildStatement(user.id as string, OperationType.WITHDRAW, 150.00)

        const balance = await getBalanceUseCase.execute({
            user_id: user.id as string
        })

        expect(balance).toMatchObject({
            balance: 100,
            statement: [
                {
                    amount: 250,
                    description: 'fake statement',
                    type: 'deposit'
                },
                {
                    amount: 150,
                    description: 'fake statement',
                    type: 'withdraw'
                }
            ]
        })
    })
})
