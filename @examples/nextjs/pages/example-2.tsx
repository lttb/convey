import {useResolver} from '@convey/react'

import {getServerGreeting} from '@examples/nextjs/resolvers/server/example-2'

const Demo = () => {
    const [greeting, meta] = useResolver(
        getServerGreeting({
            name: 'world',
            age: 1,
        }),
    )

    if (meta.status === 'ERROR') {
        console.log(meta.error)

        return <div>Error: {meta.error.message}</div>
    }

    return (
        <div>
            <p>Result: {greeting}</p>
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
