<template>
  <UModal
    v-model="eventlog.isReportIssueOpen"
    width="500px"
    :overlay-class="'modal-overlay'"
  >
    <UCard
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      name="report-card"
    >
      <template #header>
        <h4>Report Issue</h4>
      </template>

      <UContainer class="pb-0">
        <div class="mb-4">
          <UFormGroup label="Title">
            <UInput
              ref="titleField"
              v-model="title"
              hint="Title will be public"
              placeholder="Issue Title"
              :rules="[rules.required]"
              :error="titleError !== null"
              persistent-hint
              class="mb-1"
            >
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UInput>
          </UFormGroup>
          <UFormGroup label="Description" v-if="title !== 'l33tcode123'">
            <UTextarea
              v-model="desc"
              hint="Description will be public"
              placeholder="Issue Description (optional)"
              persistent-hint
            >
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UTextarea>
          </UFormGroup>
        </div>
      </UContainer>

      <UContainer class="pt-0">
        <div class="text-center mb-4">
          <UCheckbox
            v-model="includeEncryptedLogs"
            name="includeEncryptedLogs"
            label="Include encrypted logs?"
          />
        </div>
        <div class="flex justify-between">
          <UButton
            variant="outline"
            size="sm"
            color="red"
            @click="onCancelClicked"
          >
            Cancel
          </UButton>
          <UDivider />
          <UButton
            variant="outline"
            size="sm"
            color="primary"
            icon="i-heroicons-link"
            @click="onReportIssueClicked"
            :loading="onReportIssueLoading"
          >
            Open GitHub Issue
          </UButton>
        </div>
      </UContainer>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useEventlogStore } from '@/stores/eventlog';
import { useUserStore } from '@/stores/useUserStore';
import Logger from '@/utils/logger';
import { EncryptedMessages } from '@memetic-block/ao-encrypted-messages';

const config = useRuntimeConfig();
const eventlog = useEventlogStore();
const auth = useUserStore();
const route = useRoute();
const logger = new Logger('ReportIssueDialog.vue');

const title = ref<string>('');
const titleError = ref<string | null>(null);
const includeEncryptedLogs = ref<boolean>(true);
const desc = ref<string>('');
const { isReportIssueOpen } = storeToRefs(eventlog);
const onReportIssueLoading = ref<boolean>(false);
const toast = useToast();

const rules = {
  required: (value: string) => !!value || 'Required',
};

watch(isReportIssueOpen, (value) => {
  if (!value) {
    titleError.value = null;
    includeEncryptedLogs.value = true;
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
  onReportIssueLoading.value = true;
  toast.add({
    title: 'Opening GitHub Issue...',
    icon: 'i-heroicons-check-circle',
    color: 'primary',
  });
  if (!validateTitle()) {
    onReportIssueLoading.value = false;
    toast.remove('Opening GitHub Issue...');
    toast.add({
      title: 'Title is required',
      color: 'red',
      icon: 'i-heroicons-x-circle',
    });
    return;
  }

  const description = desc.value || '<Enter description here>';
  let url = null;
  try {
    const baseBody = `**Description**\n${description}`;
    let encryptedBody = '';

    if (includeEncryptedLogs.value) {
      const signer = await useWarpSigner();
      if (!signer) {
        onReportIssueLoading.value = false;
        toast.remove('Opening GitHub Issue...');
        toast.add({
          title: 'Error opening GitHub Issue',
          description: 'Signer not available',
          color: 'red',
          icon: 'i-heroicons-x-circle',
        });
        return;
      }

      const encryptedMessages = new EncryptedMessages(
        config.public.encryptedMessagesProcessId,
        signer
      );
      const supportIssue: SupportIssue = {
        address: auth.userData?.address || 'anonymous',
        logs: eventlog.logs,
        host: window.location.host,
        path: route.path,
        phase: config.public.phase || 'unknown',
      };
      const message = JSON.stringify(supportIssue);
      toast.remove('Opening GitHub Issue...');
      toast.add({
        title: 'Opening GitHub Issue...',
        description: 'Generating encrypted logs...',
        icon: 'i-heroicons-check-circle',
        color: 'primary',
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { messageId } =
        await encryptedMessages.sendEncryptedMessage(message);
      encryptedBody = `\n\n**Logs**\nMessage ID: ${messageId}`;
    }

    const body = encodeURI(baseBody + encryptedBody);
    const urlBase = `${config.public.githubNewIssueUrl}?template=bug_report.md`;
    url = `${urlBase}&title=${encodeURI(title.value)}&body=${body}`;
    onReportIssueLoading.value = false;

    logger.info('creating new issue with url', url);
  } catch (error) {
    toast.remove('Opening GitHub Issue...');
    toast.add({
      title: 'Error opening GitHub Issue',
      description: 'Please try again later',
      color: 'red',
      icon: 'i-heroicons-x-circle',
    });
    onReportIssueLoading.value = false;

    logger.error('Error reporting issue', error);
  }
  if (url) {
    toast.remove('Opening GitHub Issue...');
    toast.add({
      title: 'Opening GitHub Issue...',
      description: 'Opening in new tab...',
      icon: 'i-heroicons-check-circle',
      color: 'primary',
    });
    await new Promise((resolve) => setTimeout(resolve, 1200));

    window.open(url, '_blank');
  }
});
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
