import { emailCType } from '../cTypes/emailCType';
import { twitterCType } from '../cTypes/twitterCType';
export const supportedCTypeKeys = ['email', 'twitter'];
export const supportedCTypes = {
  email: emailCType,
  twitter: twitterCType,
};
export const kiltCost = {
  email: 2,
  twitter: 3,
};
export function isSupportedCType(cType) {
  return supportedCTypeKeys.includes(cType);
}
