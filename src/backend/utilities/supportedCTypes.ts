import type { ICType } from '@kiltprotocol/sdk-js';

import { emailCType } from '../cTypes/emailCType';

import { twitterCType } from '../cTypes/twitterCType';

export const supportedCTypeKeys = ['email', 'twitter'] as const;

export type SupportedCType = (typeof supportedCTypeKeys)[number];

export const supportedCTypes: Record<SupportedCType, ICType> = {
  email: emailCType,
  twitter: twitterCType,
};

export const kiltCost: Record<
  SupportedCType,
  { raw: string; formatted: string }
> = {
  email: { raw: '0.000000000000002', formatted: '2 microKILT' },
  twitter: { raw: '0.000000000000002', formatted: '3 microKILT' },
};

export function isSupportedCType(cType: string): cType is SupportedCType {
  return supportedCTypeKeys.includes(cType as SupportedCType);
}
