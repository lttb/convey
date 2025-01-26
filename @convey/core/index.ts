export function createResolver(resolver: any) {}
export function createModel(resolver: any) {}
export function createCollection(resolver: any, indexed: any) {}
export function createIdentifier(_: any) {}

import { entity } from './serialiser'

class LoadId extends entity<string>() {}

type LoadStep = {
	location: string
	// TODO: keep info about timezones, maybe other formats
	time: number
	type: 'ASAP' | 'APPT'
}

const Load = createCollection({
	prebook(_: {
		loadNumber: string
		truckId: string
		productOrderNumber: string
		// TODO: support multiple pick ups
		pu: LoadStep
		del: LoadStep
		// what about miles - loaded and DH?
	}) {},
})

const prebookLoad = createResolver(
	async (params: {
		loadNumber: string
		truckId: string
		productOrderNumber: string
		// TODO: support multiple pick ups
		pu: LoadStep
		del: LoadStep
		// what about miles - loaded and DH?
	}) => {
		// should be automatically checked that user has dispatcher role
		const user = await getUser()
	},
)

const confirmLoadWithBroker = createResolver(
	async (params: {
		loadId: string
		messageId: string
	}) => {},
)

const confirmLoadWithDriver = createResolver(
	async (params: {
		loadId: string
	}) => {},
)
