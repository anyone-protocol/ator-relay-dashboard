<template>
  <v-dialog v-model="eventlog.isSupportIssueOpen" width="500">
    <v-card>
      <v-card-title>
        <h4>Decrypt Support Issue</h4>
      </v-card-title>
      <v-card-text>
        <v-container class="pb-0">
          <v-row dense>
            <v-col cols="12">
              <h5>{{ title }}</h5>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12">
              <v-textarea
                v-model="encrypted"
                label="Encrypted Payload"
                density="compact"
                :rules="[rules.required]"
              />

              <v-text-field
                v-model="nonce"
                label="Nonce"
                density="compact"
                :rules="[rules.required]"
              />

              <v-text-field
                v-model="publicKey"
                label="Public Key"
                density="compact"
                :rules="[rules.required]"
              />

              <v-text-field
                v-model="decryptionKey"
                label="Decryption Key"
                density="compact"
                :rules="[rules.required]"
              />
            </v-col>
          </v-row>
          <v-row v-if="supportIssue">
            <v-col cols="12">
              phase: <code>{{ supportIssue.phase }}</code>
            </v-col>
            <v-col cols="12">
              addr: <code>{{ supportIssue.address }}</code>
            </v-col>
            <v-col cols="12">
              host: <code>{{ supportIssue.host }}</code>
            </v-col>
            <v-col cols="12">
              path: <code>{{ supportIssue.path }}</code>
            </v-col>
            <v-col cols="12">
              <v-btn
                variant="outlined"
                size="x-small"
                :append-icon="logsCopySuccess ? 'mdi-check' : undefined"
                @click="onCopyLogsClicked"
              >
                copy logs
              </v-btn>
            </v-col>
            <v-col cols="12">
              logs: <code>{{ supportIssue.logs }}</code>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-container class="pt-0">
          <v-row dense>
            <v-col cols="auto">
              <v-btn
                variant="outlined"
                color="error"
                size="x-small"
                @click="onCancelClicked"
              >
                Cancel
              </v-btn>
            </v-col>
            <v-spacer />
            <v-col cols="auto">
              <v-btn
                variant="outlined"
                color="primary"
                size="x-small"
                @click="onDecryptClicked"
              >
                Decrypt
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { type SupportIssue, useEventlogStore } from '@/stores/eventlog'
import Logger from '~/utils/logger'

const route = useRoute()
const eventlog = useEventlogStore()
const logger = new Logger('SupportIssueDialog.vue')

const _title = Array.isArray(route.query.title)
  ? route.query.title.join(' ')
  : [route.query.title || ''].join(' ')
const title = ref<string>(_title)

const _nonce = Array.isArray(route.query.nonce)
  ? route.query.nonce.join(' ')
  : [route.query.nonce || ''].join(' ')
const nonce = ref<string>(_nonce)

const _key = Array.isArray(route.query.key)
  ? route.query.key.join(' ')
  : [route.query.key || ''].join(' ')
const publicKey = ref<string>(_key)

const _encrypted = Array.isArray(route.query.key)
  ? route.query.key.join(' ')
  : [route.query.key || ''].join(' ')
const encrypted = ref<string>(_encrypted)

const decryptionKey = ref<string>('')
const supportIssue = ref<SupportIssue | null>(null)

const onCancelClicked = debounce(() => {
  eventlog.isSupportIssueOpen = false
})

const rules = {
  required: (value: string) => !!value || 'Required'
}

const onDecryptClicked = debounce(() => {
  if (!nonce.value) { return }
  if (!publicKey.value) { return }
  if (!encrypted.value) { return }
  if (!decryptionKey.value) { return }

  try {
    const decrypted = decrypt(
      encrypted.value,
      nonce.value,
      publicKey.value,
      decryptionKey.value
    )
    logger.info('decrypted support issue', decrypted)

    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
    const parsed = JSON.parse(decrypted)
    logger.info('parsed support issue', parsed)

    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
    supportIssue.value = parsed
  } catch (error) {
    logger.error('Error decrypting', error)
  }
})

const logsCopySuccess = ref<boolean>(false)
const onCopyLogsClicked = debounce(async () => {
  if (!supportIssue.value) { return }

  const type = 'text/plain'
  const logsJson = JSON.stringify(supportIssue.value.logs)
  const logsBlob = new Blob([logsJson], { type })
  const item = new ClipboardItem({ [type]: logsBlob })

  try {
    await navigator.clipboard.write([item])
    logsCopySuccess.value = true
  } catch (error) {
    logger.error('Error copying logs to clipboard', error)
  }
})
</script>
