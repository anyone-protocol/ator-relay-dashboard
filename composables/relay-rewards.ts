import BigNumber from 'bignumber.js';
import moment from 'moment';

import type { PreviousDistribution } from '@/types/facilitator';
import Logger from '~/utils/logger';

export type RelayRewardsConfiguration = {
  TokensPerSecond: number;
  //     Modifiers = {
  //       Network = { Share = 1 },
  //       Hardware = { Enabled = false, Share = 0.2, UptimeInfluence = 0.35 },
  //       Uptime = { Enabled = false, Share = 0.14,
  //         Tiers = {
  //           ['0'] = 0,
  //           ['3'] = 1,
  //           ['14'] = 3,
  //         }
  //       },
  //       ExitBonus = { Enabled = false, Share = 0.1 }
  //     },
  //     Multipliers = {
  //       Family = { Enabled = false, Offset = 0.01, Power = 1 },
  //       Location = { Enabled = false, Offset = 0.003, Power = 2 }
  //     },
  //     Delegates = {
  // --      [Address] = { Address: '', Share = 0 }
  //     }
};

export type LastRoundData = {
  Timestamp: number;
  Period: number;
  Details: {
    Address: string;
    Score: {
      Network: number;
      IsHardware: boolean;
      UptimeStreak: number;
      ExitBonus: boolean;
      FamilySize: number;
      LocationSize: number;
    };
    Variables: {
      FamilyMultiplier: number;
      LocationMultiplier: number;
    };
    Rating: {
      Network: number;
      Uptime: number;
      ExitBonus: number;
      IsHardware: boolean;
    };
    Reward: {
      Total: string;
      OperatorTotal: string;
      DelegateTotal: string;
      Network: string;
      Hardware: string;
      Uptime: string;
      ExitBonus: string;
    };
  };
};

export type PreviousRound = {
  Timestamp: number;
  Period: number;
  Summary: {
    Ratings: {
      Network: 0;
      Uptime: 0;
      ExitBonus: 0;
    };
    Rewards: {
      Total: 0;
      Network: 0;
      Hardware: 0;
      Uptime: 0;
      ExitBonus: 0;
    };
  };
  Configuration: RelayRewardsConfiguration;
  Details: {
    [fingerprint: string]: {
      Address: string;
      Score: {
        Network: number;
        IsHardware: boolean;
        UptimeStreak: number;
        ExitBonus: boolean;
        FamilySize: number;
        LocationSize: number;
      };
      Variables: {
        FamilyMultiplier: number;
        LocationMultiplier: number;
      };
      Rating: {
        Network: number;
        Uptime: number;
        ExitBonus: number;
      };
      Reward: {
        Total: number;
        OperatorTotal: number;
        Delegatetotal: number;
        Network: number;
        Hardware: number;
        Uptime: number;
        ExitBonus: number;
      };
    };
  };
};

export class RelayRewards {
  private readonly logger = new Logger('RelayRewards');

  private _refreshing: boolean = false;

  constructor(private readonly processId: string) {}

  private setRefreshing(refreshing: boolean) {
    // useFacilitatorStore().distributionRefreshing = refreshing;
    this._refreshing = refreshing;
  }

  async refresh() {
    if (this._refreshing) {
      return;
    }

    try {
      this.setRefreshing(true);
      const previousRound = await this.getPreviousRound();

      const formatDuration = (elapsed: string) => {
        const duration = moment.duration(elapsed);
        const d = duration.days();
        const h = duration.hours();
        const m = duration.minutes();
        const s = duration.seconds();
        const ms = duration.milliseconds();

        return `${d}.${h}:${m}:${s}.${ms}`;
      };

      const date = new Date(previousRound.Timestamp);
      const previousDistribution: PreviousDistribution = {
        timestamp: previousRound.Timestamp.toString(),
        date,
        period: previousRound.Period,
        timeElapsed: formatDuration(previousRound.Period.toString()),
        timeElapsedHumanized: moment
          .duration(previousRound.Period.toString())
          .humanize(),
        tokensDistributedPerDay: BigNumber(
          previousRound.Configuration.TokensPerSecond
        )
          .dividedBy(Math.pow(10, 18))
          .times(24 * 60 * 60)
          .toFormat(2),
        totalScore: BigNumber(previousRound.Summary.Ratings.Network).toFormat(),
        totalDistributed: BigNumber(previousRound.Summary.Rewards.Total)
          .dividedBy(Math.pow(10, 18))
          .toFormat(2),
        fromNowHumanized: moment(date).fromNow(),
      };

      // useFacilitatorStore().sumOfTotalDistributions =
      previousDistribution.totalDistributed;
      // useFacilitatorStore().previousDistributions = [previousDistribution];
      // useFacilitatorStore().distributionPerRelay = Object.fromEntries(
      //   Object.entries(previousRound.Details).map(([fingerprint, details]) => [
      //     fingerprint,
      //     BigNumber(details.Reward.Total)
      //       .dividedBy(Math.pow(10, 18))
      //       .decimalPlaces(3),
      //   ])
      // );
      // useFacilitatorStore().bonusesPerRelay = Object.fromEntries(
      //   Object.entries(previousRound.Details).map(([fingerprint, details]) => [
      //     fingerprint,
      //     {
      //       hardware: BigNumber(details.Reward.Hardware || 0)
      //         .dividedBy(Math.pow(10, 18))
      //         .decimalPlaces(3),
      //       quality: BigNumber(details.Reward.Uptime || 0)
      //         .dividedBy(Math.pow(10, 18))
      //         .decimalPlaces(3),
      //     },
      //   ])
      // );
      // useFacilitatorStore().multipliersPerRelay = Object.fromEntries(
      //   Object.entries(previousRound.Details).map(([fingerprint, details]) => [
      //     fingerprint,
      //     {
      //       family: details.Variables.FamilyMultiplier.toFixed(4).toString(),
      //       region: details.Variables.LocationMultiplier.toFixed(4).toString(),
      //     },
      //   ])
      // );
      // useFacilitatorStore().scorePerRelay = Object.fromEntries(
      //   Object.entries(previousRound.Details).map(([fingerprint, details]) => [
      //     fingerprint,
      //     BigNumber(details.Rating.Network)
      //       .plus(details.Rating.ExitBonus)
      //       .plus(details.Rating.Uptime)
      //       .decimalPlaces(4),
      //   ])
      // );
      // useFacilitatorStore().baseTokensPerRelay = Object.fromEntries(
      //   Object.entries(previousRound.Details).map(([fingerprint, details]) => [
      //     fingerprint,
      //     BigNumber(details.Reward.Total)
      //       .minus(details.Reward.Hardware)
      //       .minus(details.Reward.Uptime)
      //       .minus(details.Reward.ExitBonus)
      //       .dividedBy(Math.pow(10, 18))
      //       .decimalPlaces(4),
      //   ])
      // );
      // useFacilitatorStore().lastDistributionTimePerRelay = Object.fromEntries(
      //   Object.keys(previousRound.Details).map((fingerprint) => [
      //     fingerprint,
      //     new Date(previousRound.Timestamp).toLocaleString('en-US', {
      //       month: 'short',
      //       day: '2-digit',
      //       hour: '2-digit',
      //       minute: '2-digit',
      //       second: '2-digit',
      //       hour12: false,
      //     }),
      //   ])
      // );

      // useFacilitatorStore().exitBonusPerRelay = Object.fromEntries(
      //   Object.entries(previousRound.Details).map(([fingerprint, details]) => [
      //     fingerprint,
      //     BigNumber(details.Reward.ExitBonus)
      //       .dividedBy(Math.pow(10, 18))
      //       .decimalPlaces(4)
      //       .toString(),
      //   ])
      // );

      await this.refreshAuthedUserClaimableTokens();
    } catch (error) {
      this.logger.error('Error refreshing RelayRewards', error);
    } finally {
      this.setRefreshing(false);
    }
  }

  async refreshAuthedUserClaimableTokens() {
    // Update store if it's the authenticated user's address
    const auth = useUserStore();
    if (auth.userData && auth.userData.address) {
      const address = auth.userData.address;
      const claimable = await this.getClaimable(address);
      this.logger.log('address', address, 'claimable', claimable);
      // useFacilitatorStore().claimableAtomicTokens = claimable || undefined;
    }
  }

  async getClaimable(address: string): Promise<string | null> {
    try {
      const { result } = await sendAosDryRun({
        processId: this.processId,
        tags: [
          { name: 'Action', value: 'Get-Rewards' },
          { name: 'Address', value: address },
        ],
      });

      console.log('getClaimable result', result);

      const claimable = result?.Messages[0]?.Data || '0';

      return BigNumber(claimable).toString();
    } catch (error) {
      this.logger.error('Error fetching claimable rewards', error);
    }

    return null;
  }

  async getPreviousRound(): Promise<PreviousRound> {
    try {
      const { result } = await sendAosDryRun({
        processId: this.processId,
        tags: [{ name: 'Action', value: 'Last-Snapshot' }],
      });

      if (result.Error) {
        throw new Error('Error from AOS: ' + result.Error);
      }

      return JSON.parse(result.Messages[0].Data) as PreviousRound;
    } catch (error) {
      this.logger.error('Error fetching previous round', error);
    }

    throw new Error('No previous round found');
  }
}

const config = useRuntimeConfig();
const relayRewards = new RelayRewards(config.public.relayRewardsProcessId);
export const useRelayRewards = () => relayRewards;
