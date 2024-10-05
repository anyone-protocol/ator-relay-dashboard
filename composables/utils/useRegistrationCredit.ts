import { useUserStore } from '@/stores/useUserStore';
import { storeToRefs } from 'pinia';

export const fetchRegistrationCredit = async (relays: any) => {
  console.log('fetchRegistrationCredit..................');
  const userStore = useUserStore();
  const relayCredits = ref<Record<string, boolean | undefined>>({});
  const familyVerified = ref<Record<string, boolean>>({});
  const registrationCreditsRequired = ref<boolean>(true);
  const familyRequired = ref<boolean>(true);

  if (relays) {
    for (const relay of relays) {
      relayCredits.value[relay.fingerprint] =
        await userStore.hasRegistrationCredit(relay.fingerprint);
      familyVerified.value[relay.fingerprint] = await userStore.familyVerified2(
        relay.fingerprint
      );
    }
  }

  registrationCreditsRequired.value = userStore.registrationCreditsRequired;
  familyRequired.value = userStore.familyRequired;

  return {
    relayCredits: relayCredits.value,
    familyVerified: familyVerified.value,
    registrationCreditsRequired: registrationCreditsRequired.value,
    familyRequired: familyRequired.value,
  };
};
