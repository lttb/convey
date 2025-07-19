import { createElement, useEffect, useState } from 'react'

import { useResolver } from './useResolver'

type SerializableElement = {
  type: any
  props: any
  key: string | ((props: any) => Promise<SerializableElement>)
}

export async function serialize(element: SerializableElement) {
  if (!element?.type) return element

  const result = { type: element.type, props: { ...element.props } }

  if (typeof element.key === 'function') {
    return serialize(await element.key(element.props))
  }

  if (result.props.children) {
    result.props.children = await Promise.all(
      [].concat(element.props?.children ?? []).map((child) => serialize(child)),
    )
  }

  return result
}

export function deserialize(element: { type: any; props: any }) {
  if (!element?.type) return element

  const result = { type: element.type, props: { ...element.props } }

  if (result.props.children) {
    result.props.children = []
      .concat(element.props?.children ?? [])
      .map((child) => deserialize(child))
  }

  return createElement(result.type, result.props)
}

function useValue(v: any) {
  const [state, setState] = useState(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if (typeof v === 'function') {
      v().then(setState)
    } else {
      setState(v)
    }
  }, [])
  return state
}
export function ServerComponent({ value }: { value: any }) {
  const result = useValue(value)
  const [element] = useResolver(result)

  return deserialize(element as any) || null
}
