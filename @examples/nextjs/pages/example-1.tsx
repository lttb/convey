import { useResolver } from '@convey/react'

import {
  getDate,
  getDateStream,
} from '@examples/nextjs/resolvers/server/example-1'

const DateComponent = () => {
  const [serverDate] = useResolver(getDate())

  return (
    <div>
      <p>Date: {serverDate}</p>
    </div>
  )
}

const DateStreamComponent = () => {
  const [serverDate] = useResolver(getDateStream())

  return (
    <div>
      <p>Date: {serverDate}</p>
    </div>
  )
}

export default function Simple() {
  return (
    <>
      <DateComponent />
      <DateStreamComponent />
    </>
  )
}
