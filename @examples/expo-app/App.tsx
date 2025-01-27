import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'

import { setConfig } from '@convey/core'
import { createResolverFetcher } from '@convey/core/client'

import { getDate, getDateStream } from './resolvers/server'
import { useResolver } from '@convey/react'

setConfig({
	fetch: createResolverFetcher({
		url: (structure) =>
			`http://localhost:3000/api/resolvers/${structure.options.id}`,
	}),
})

const DateComponent = () => {
	const [date] = useResolver(getDate())

	return <Text>Current date: {date}</Text>
}

const DateStreamComponent = () => {
	const [date] = useResolver(getDateStream())

	return <Text>Current date: {date}</Text>
}

export default function App() {
	return (
		<View style={styles.container}>
			<Text>Open up App.tsx to start working on your app!</Text>
			<DateComponent />
			{/* <DateStreamComponent /> */}
			<StatusBar style="auto" />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
})
