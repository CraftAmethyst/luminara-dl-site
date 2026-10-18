<script setup lang="ts">
import { computed, useId } from 'vue'
import type { BranchId } from '@/types/releases'
import { BRANCH_ORDER } from '@/content/branches'
import { useI18n } from '@/i18n'

const props = defineProps<{
  modelValue: BranchId
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BranchId]
}>()

const { t } = useI18n()
const uid = useId()

const model = computed({
  get: () => props.modelValue,
  set: (value: BranchId) => emit('update:modelValue', value),
})

const labels: Record<
  BranchId,
  'branchTrials' | 'branchFeudalKings'
> = {
  trials: 'branchTrials',
  feudalkings: 'branchFeudalKings',
}
</script>

<template>
  <fieldset class="m-0 min-w-0 border-0 p-0">
    <legend class="sr-only">{{ t('branchGroup') }}</legend>
    <div class="segmented">
      <template v-for="branch in BRANCH_ORDER" :key="branch">
        <input
          :id="`${uid}-${branch}`"
          v-model="model"
          type="radio"
          :name="`${uid}-branch`"
          :value="branch"
        />
        <label
          :for="`${uid}-${branch}`"
          :class="compact ? '!px-2 !py-1' : ''"
        >
          {{ t(labels[branch]) }}
        </label>
      </template>
    </div>
  </fieldset>
</template>
