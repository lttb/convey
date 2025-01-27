import { useState } from 'react'
import { getDate, getDateStream } from '../resolvers/server'
import { useResolver } from '@convey/react'

const DateComponent = () => {
	const [date] = useResolver(getDate())

	return <p>Current date: {date}</p>
}

const DateStreamComponent = () => {
	const [date] = useResolver(getDateStream())

	return <p>Current date: {date}</p>
}

function Card() {
	const [count, setCount] = useState(0)

	return (
		<div className="card">
			<DateComponent />
			<DateStreamComponent />

			<button type="button" onClick={() => setCount((count) => count + 1)}>
				count is {count}
			</button>
			<p>
				Edit <code>src/App.tsx</code> and save to test HMR
			</p>
		</div>
	)
}

export default Card
