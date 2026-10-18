import { computed, ref } from 'vue'
import type { ReleaseAsset } from '@/types/releases'

const asset = ref<ReleaseAsset | null>(null)

export const dialogAsset = computed(() => asset.value)

export function openDownloadDialog(next: ReleaseAsset): void {
  asset.value = next
}

export function closeDownloadDialog(): void {
  asset.value = null
}
