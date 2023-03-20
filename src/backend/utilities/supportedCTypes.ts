import type { ICType } from '@kiltprotocol/sdk-js';

import { emailCType } from '../cTypes/emailCType';

import { twitterCType } from '../cTypes/twitterCType';

export const supportedCTypeKeys = ['email', 'twitter'] as const;

export type SupportedCType = (typeof supportedCTypeKeys)[number];

export const supportedCTypes: Record<SupportedCType, ICType> = {
  email: emailCType,
  twitter: twitterCType,
};

export const cTypeCost: Record<SupportedCType, number> = {
  email: 2,
  twitter: 3,
};
