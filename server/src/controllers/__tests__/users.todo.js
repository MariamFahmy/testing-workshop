import {omit} from 'lodash'
import db from '../../utils/db'
import {initDb, generate} from 'til-server-test-utils'
import * as usersController from '../users.todo'

function setup() {
  const req = {
    body: {},
  }
  const res = {}
  Object.assign(res, {
    status: jest.fn(
      function status() {
        return this
      }.bind(res),
    ),
    json: jest.fn(
      function json() {
        return this
      }.bind(res),
    ),
    send: jest.fn(
      function send() {
        return this
      }.bind(res),
    ),
  })
  return {req, res}
}

const safeUser = u => omit(u, ['salt', 'hash'])

beforeEach(() => initDb())

test('getUsers returns all users in the database', async () => {
  await initDb()
  const req = {}
  const res = {
    json: jest.fn(),
  }
  
  await usersController.getUsers(req, res)

  expect(res.json).toHaveBeenCalledTimes(1)
  const firstCall = res.json.mock.calls[0]
  const firstArg = firstCall[0]
  const {users} = firstArg
  expect(users.length).toBeGreaterThan(0)
  const actualUsers = await db.getUsers()
  expect(users).toEqual(actualUsers.map(safeUser))
}) 

test('deleteUser will 403 if not requested by the user', async () => {
  const {req, res} = setup()
  const testUser = await db.insertUser(generate.userData())
  req.params = {id: testUser.id}
  req.user = {id: generate.id()}
  await usersController.deleteUser(req, res)
  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(403)
  expect(res.send).toHaveBeenCalledTimes(1)
})

test('deleteUser will 404 if user does not exist', async () => {
  const {req, res} = setup()
  req.params = {id: generate.id()}
  req.user = {id: generate.id()}
  await usersController.deleteUser(req, res)
  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(404)
  expect(res.send).toHaveBeenCalledTimes(1)
})

test('deleteUser will delete the user if properly requested', async () => {
  const {req, res} = setup()
  const testUser = await db.insertUser(generate.userData())
  req.params = {id: testUser.id}
  req.user = {id: testUser.id}
  await usersController.deleteUser(req, res)
  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(204)
  expect(res.send).toHaveBeenCalledTimes(1)
  const userFromDb = await db.getUser(testUser.id)
  expect(userFromDb).toEqual(undefined)
})

