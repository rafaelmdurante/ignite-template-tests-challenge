import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository"
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository"
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase"
import { GetStatementOperationError } from './GetStatementOperationError'
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase"
import { CreateStatementUseCase } from '../createStatement/CreateStatementUseCase'
import { OperationType } from "../../entities/Statement"

let sut: GetStatementOperationUseCase
let usersRepository: InMemoryUsersRepository
let statementsRepository: InMemoryStatementsRepository
let createUserUseCase: CreateUserUseCase
let createStatementUseCase: CreateStatementUseCase

async function buildUser() {
    return await createUserUseCase.execute({
        email: 'fake@mail.com',
        name: 'fake user',
        password: 'fake password'
    })
}

async function buildStatement(userId: string, type: OperationType, amount: number) {
    return await createStatementUseCase.execute({
        amount: amount,
        description: 'fake statement',
        type: type,
        user_id: userId
    })
}

describe('GetStatementOperation UseCase', () => {
    beforeEach(() => {
        usersRepository = new InMemoryUsersRepository()
        statementsRepository = new InMemoryStatementsRepository()
        createUserUseCase = new CreateUserUseCase(usersRepository)
        createStatementUseCase = new CreateStatementUseCase(
            usersRepository,
            statementsRepository
        )
        sut = new GetStatementOperationUseCase(
            usersRepository, statementsRepository
        )
    })

    it('should throw UserNotFound error if user does not exist', async () => {
        const nonExistingUserId = 'invalid_user id'
        const nonExistentStatementId = 'invalid statement id'

        await expect(
            sut.execute({
                user_id: nonExistingUserId,
                statement_id: nonExistentStatementId
            })
        ).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
    })

    it('should throw StatementNotFound error if a user has no statements', async () => {
        const user = await buildUser()
        const nonExistentStatementId = 'invalid statement id'

        await expect(
            sut.execute({
                user_id: user.id as string,
                statement_id: nonExistentStatementId
            })
        ).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
    })

    it('should be able to get a specific operation from a user', async () => {
        const user = await buildUser()
        const statement = await buildStatement(
            user.id as string,
            OperationType.DEPOSIT,
            100
        )

        const result = await sut.execute({
            user_id: user.id as string,
            statement_id: statement.id as string
        })

        expect(result).toMatchObject({
            description: 'fake statement',
            amount: 100,
            type: 'deposit'
        })
    })
})
