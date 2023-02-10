import {useState, useEffect, createElement} from 'react'

import {useResolver} from './useResolver'

export async function serialize(element) {
  if (!element?.type) return element

  const result = {type: element.type, props: {...element.props}}

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

export function deserialize(element) {
  if (!element?.type) return element

  const result = {type: element.type, props: {...element.props}}

  if (result.props.children) {
    result.props.children = []
      .concat(element.props?.children ?? [])
      .map((child) => deserialize(child))
  }

  return createElement(result.type, result.props)
}

function useValue(v) {
  const [state, setState] = useState(null)
  useEffect(() => {
    if (typeof v === 'function') {
      v().then(setState)
    } else {
      setState(v)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return state
}

export function ServerComponent({value}: {value: any}) {
  const result = useValue(value)
  const [element] = useResolver(result)

  return deserialize(element) || null
}
