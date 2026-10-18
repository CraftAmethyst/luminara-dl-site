import { readonly, ref } from 'vue'
import {
  readStoredProxy,
  writeStoredProxy,
  type ProxyId,
} from './downloads'

const proxyId = ref<ProxyId>(readStoredProxy())

export const selectedProxy = readonly(proxyId)

export function setProxy(id: ProxyId): void {
  proxyId.value = id
  writeStoredProxy(id)
}
