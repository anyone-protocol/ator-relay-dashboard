export type OperatorRegistryState = {
  ClaimableFingerprintsToOperatorAddresses: { [fingerprint: string]: string };
  VerifiedFingerprintsToOperatorAddresses: { [fingerprint: string]: string };
  BlockedOperatorAddresses: { [fingerprint: string]: boolean };
  RegistrationCreditsFingerprintsToOperatorAddresses: {
    [fingerprint: string]: string;
  };
  VerifiedHardwareFingerprints: { [fingerprint: string]: boolean };
};
