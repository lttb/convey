import { createResolver, invalidate } from '@convey/core'
import { useResolver } from '@convey/react'
import {
  createUser,
  getUser,
  getUserIds,
  updateUserName,
} from '@examples/nextjs/resolvers/server/example-4'
import type { User } from '@prisma/client'

const createNewUser = createResolver(async () => {
  const user = await createUser({
    name: 'John Doe',
    email: `john-${Date.now()}@doe.com`,
  })

  await invalidate(getUserIds())

  return user
})

const updateUser = createResolver(async () => {
  const user = await updateUserName(1, `Jane Doe ${Math.random()}`)

  await invalidate(getUser(1))

  return user
})

const UserComponent = ({ userId }: { userId: User['id'] }) => {
  const [user] = useResolver(getUser(userId))

  if (user === undefined) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>User "{userId}" not found</div>
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
        type="button"
        onClick={async () => {
          await createNewUser()

          alert('Done!')
        }}
      >
        Create New User
      </button>

      <button
        type="button"
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
