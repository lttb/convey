import {useResolver} from '@convey/react'
import {getServerDate} from '@examples/nextjs/resolvers/server/example-1'

const Demo = () => {
  const [serverDate] = useResolver(getServerDate())

  return (
    <div>
      <p>Result: {serverDate}</p>
    </div>
  )
}

export default function Simple() {
  return (
    <>
      <Demo />
    </>
  )
}
