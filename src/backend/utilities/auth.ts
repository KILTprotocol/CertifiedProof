import basicAuth from 'express-basic-auth';
import { configuration } from './configuration';

const { adminUsername, adminPassword } = configuration;

export const auth = basicAuth({
  users: { [adminUsername]: adminPassword },
  challenge: true,
});
