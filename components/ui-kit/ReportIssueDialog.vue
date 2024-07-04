<template>
  <UModal v-model="eventlog.isReportIssueOpen" width="500px" :overlay-class="'modal-overlay'">
    <UCard class="modal-card" name="text-black dark:text-white">
      <template #header>
        <h4 tabindex="999" @keyup="onKeyup">Report Issue</h4>
      </template>

      <UContainer class="pb-0">
        <div class="mb-4">
          <UFormGroup label="Title">
            <UInput ref="titleField" v-model="title" hint="Title will be public" placeholder="Issue Title"
              :rules="[rules.required]" :error="titleError !== null" persistent-hint class="mb-1">
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UInput>
          </UFormGroup>
          <UFormGroup label="Description" v-if="title !== 'l33tcode123'">
            <UTextarea v-model="desc" hint="Description will be public" placeholder="Issue Description (optional)"
              persistent-hint>
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UTextarea>
          </UFormGroup>
        </div>
      </UContainer>

      <UContainer class="pt-0">
        <div class="text-center mb-4" v-if="title !== 'l33tcode123'">
          <UButton variant="outline" size="sm" color="primary"
            :icon="logsCopySuccess ? 'i-heroicons-check' : 'i-heroicons-clipboard'" @click="onCopyLogsClicked">
            (Optional) Copy Encrypted Logs
          </UButton>
        </div>

        <div class="text-center mb-4" v-else>
          <UFormGroup label="Paste Logs">
            <UTextarea v-model="pastedLogs" hint="Paste encrypted logs here" placeholder="Encrypted Logs" persistent-hint>
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UTextarea>
          </UFormGroup>
          <UFormGroup label="Private Key" class="mt-[1rem]">
            <UInput v-model="privateKey" hint="Enter your private key" placeholder="Private Key" persistent-hint class="mb-1">
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UInput>
          </UFormGroup>
          <div v-if="decryptedLogs">
            <h4>Decrypted Logs:</h4>
            <pre>{{ decryptedLogs }}</pre>
          </div>
        </div>

        <div class="flex justify-between">
          <UButton variant="outline" size="sm" color="red" @click="onCancelClicked">
            Cancel
          </UButton>
          <UDivider />
          <UButton v-if="title !== 'l33tcode123'" variant="outline" size="sm" color="primary" icon="i-heroicons-link" @click="onReportIssueClicked">
            Open GitHub Issue
          </UButton>
          <UButton v-else variant="outline" size="sm" color="primary" @click="decryptLogs">
            Decrypt Logs
          </UButton>
        </div>
      </UContainer>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { hexlify } from 'ethers';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useEventlogStore } from '@/stores/eventlog';
import { useUserStore } from "@/stores/useUserStore"
import Logger from '@/utils/logger';
import { encrypt, decrypt } from '@/utils/crypto';
import { set } from 'lodash';

const config = useRuntimeConfig();
const eventlog = useEventlogStore();
const auth = useUserStore();
const route = useRoute();
const logger = new Logger('ReportIssueDialog.vue');

const title = ref<string>('');
const titleError = ref<string | null>(null);
const desc = ref<string>('');
const payload = ref<EncryptedPayload>();
const { isReportIssueOpen, isSupportIssueOpen } = storeToRefs(eventlog);

const pastedLogs = ref<string>('');
const privateKey = ref<string>('');
const decryptedLogs = ref<string | null>(null);

const rules = {
  required: (value: string) => !!value || 'Required',
};

watch(isReportIssueOpen, (value) => {
  if (!value) {
    logsCopySuccess.value = false;
    payload.value = undefined;
    titleError.value = null;
    pastedLogs.value = '';
    privateKey.value = '';
    decryptedLogs.value = null;
  }
});

const onCancelClicked = debounce(() => {
  isReportIssueOpen.value = false;
});

const validateTitle = () => {
  if (!title.value) {
    titleError.value = 'Title is required';
    return false;
  } else {
    titleError.value = null;
    return true;
  }
};

const onReportIssueClicked = debounce(async () => {
  if (!validateTitle()) {
    return;
  }

  const description = desc.value || '<Enter description here>';

  try {
    const baseBody = `**Description**\n${description}`;
    let encryptedBody = '';

    if (payload.value && logsCopySuccess.value) {
      encryptedBody = `\n\n**Logs**\n<Paste Encrypted Logs Here>`;
    }

    const body = encodeURI(baseBody + encryptedBody);
    const urlBase = `${config.public.githubNewIssueUrl}?template=bug_report.md`;
    const url = `${urlBase}&title=${encodeURI(title.value)}&body=${body}`;

    logger.info('creating new issue with url', url);
    window.open(url, '_blank');
  } catch (error) {
    logger.error('Error reporting issue', error);
  }
});

const lastkeys: string[] = [];
const onKeyup = (evt: KeyboardEvent) => {
  lastkeys.push(evt.key);
  if (lastkeys.length > 5) {
    lastkeys.shift();
  }
  if (lastkeys.join('') === 'idkfa') {
    isReportIssueOpen.value = false;
    isSupportIssueOpen.value = true;
  }
};

const logsCopySuccess = ref<boolean>(false);
const onCopyLogsClicked = debounce(async () => {
  try {
    const supportIssue: SupportIssue = {
      address: auth.userData?.address || 'anonymous',
      logs: eventlog.logs,
      host: window.location.host,
      path: route.path,
      phase: config.public.phase || 'unknown',
    };

    const { encrypted, publicKey, nonce } = encrypt(
      JSON.stringify(supportIssue),
      config.public.supportWalletPublicKeyBase64,
    );

    const encryptedPayload: EncryptedPayload = {
      encrypted: hexlify(encrypted),
      nonce: hexlify(nonce),
      publicKey: hexlify(publicKey),
    };

    payload.value = encryptedPayload;

    const type = 'text/plain';
    const logsJson = JSON.stringify(payload.value);
    const logsBlob = new Blob([logsJson], { type });
    const item = new ClipboardItem({ [type]: logsBlob });
    await navigator.clipboard.write([item]);
    logger.info('copied encrypted logs to clipboard');
    logsCopySuccess.value = true;
    setTimeout(() => {
      logsCopySuccess.value = false;
    }, 2500);
  } catch (error) {
    logger.error('Error copying logs to clipboard', error);
  }
});

const decryptLogs = () => {
  const toast = useToast();
  try {
    if (!pastedLogs.value || !privateKey.value) {
      toast.add({ title: 'Error', color: "amber", description: 'Paste logs and private key to decrypt'});
      return;
    }

    try {
      const encryptedPayload: EncryptedPayload = JSON.parse(pastedLogs.value);
      const decrypted = decrypt(
        encryptedPayload.encrypted,
        encryptedPayload.nonce,
        encryptedPayload.publicKey,
        privateKey.value,
      );
      decryptedLogs.value = JSON.stringify(decrypted, null, 2);
      // copy to clipboard
      const type = 'text/plain';
      const logsBlob = new Blob([decryptedLogs.value], { type });
      const item = new ClipboardItem({ [type]: logsBlob });
      navigator.clipboard.write([item]);
      // add toast
      toast.add({ title: 'Success', color: "green", description: 'Decrypted logs copied to clipboard!'});
    } catch (error) {
      toast.add({ title: 'Error', color: "amber", description: 'Error decrypting logs'});
    }
  } catch (error) {
    logger.error('Error decrypting logs', error);
  }
};
</script>

<style scoped>
.modal-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

.modal-card {
  background-color: #333;
  color: #fff;
}

.modal-card h4 {
  color: #fff;
}

.modal-card .u-button {
  margin-top: 16px;
}
</style>