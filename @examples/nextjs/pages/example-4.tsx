import {createResolver, invalidate} from '@convey/core'
import {useResolver} from '@convey/react'
import {
  getUserIds,
  createUser,
  updateUserName,
  getUser,
} from '@examples/nextjs/resolvers/server/example-4'
import {User} from '@prisma/client'

const createNewUser = createResolver(async function () {
  const user = await createUser({
    name: 'John Doe',
    email: `john-${Date.now()}@doe.com`,
  })

  await invalidate(getUserIds())

  return user
})

const updateUser = createResolver(async function () {
  const user = await updateUserName(1, `Jane Doe ${Math.random()}`)

  await invalidate(getUser(1))

  return user
})

const UserComponent = ({userId}: {userId: User['id']}) => {
  const [user] = useResolver(getUser(userId))

  if (user === undefined) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {user.name} / {user.email}
    </div>
  )
}

const UserList = () => {
  const [users] = useResolver(getUserIds())

  if (users === undefined) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <p>Users:</p>
      {users.map((x) => (
        <UserComponent key={x.id} userId={x.id} />
      ))}

      <button
        onClick={async () => {
          await createNewUser()

          alert('Done!')
        }}
      >
        Create New User
      </button>

      <button
        onClick={async () => {
          await updateUser()

          console.log('updated!')
        }}
      >
        Update User Name
      </button>
    </div>
  )
}

export default function Simple() {
  return (
    <>
      <UserList />
    </>
  )
}
