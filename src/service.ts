import express from 'express';
import bodyParser from 'body-parser';
import Reseller from './controllers/Reseller.js';
import UserBankAccount from './controllers/UserBankAccount.js';
import { Types, Utils } from '@ikomida/shared-backend';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let { name } = require('../package.json');
name = name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
  .replace(/^\w/, (m: string) => m.toUpperCase())
  .replace(/-\w/g, (m: string[]) => m[1].toUpperCase());
const logger = Utils.Logger.getInstance(name);

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.json({ limit: '10mb' }));
Utils.System.setExpressResponse(app);
const port = process?.env?.PORT || 80;

const reseller = new Reseller(logger);
const userPIXKey = new UserBankAccount(logger);

//MARK: --User Bank Accounts region
app.post('/reseller/userPIXKey', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await userPIXKey.newUserBankAccount(identity, req.body);
  res.status(payload?.success ? 201 : 200).sendResponse(payload);
});

app.get('/reseller/userPIXKeys/:timestamp', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await userPIXKey.getUserBankAccounts(identity, Number(req.params?.timestamp) ?? 0);
  res.sendResponse(payload);
});

//MARK: --Reseller region
app.post('/reseller', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.newReseller(identity, req.body);
  res.status(payload?.success ? 201 : 200).sendResponse(payload);
});

app.get('/resellers/:timestamp', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.getResellers(identity, Number(req.params?.timestamp) ?? 0);
  res.sendResponse(payload);
});

app.get('/restaurants/:timestamp', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.getContracts(identity, Number(req.params?.timestamp) ?? 0);
  res.sendResponse(payload);
});

app.get('/reseller/resellersCount', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.countResellers(identity);
  res.sendResponse(payload);
});

app.get('/reseller/restaurantsCount', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.countRestaurants(identity);
  res.sendResponse(payload);
});

app.get('/reseller/revuneDetails', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.revuneDetails(identity);
  res.sendResponse(payload);
});

app.get('/reseller/revuneTotal', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.revuneTotal(identity);
  res.sendResponse(payload);
});

app.get('/reseller/lastRevune', async (req, res) => {
  const identity: Types.Classes.CUser = Types.Classes.CUser.fromObject(req.headers?.identity);
  const payload = await reseller.lastRevune(identity);
  res.sendResponse(payload);
});

app.all('*', async (req, res) => {
  logger.error(`Resellers endpoint "${req?.url}" not found:`);
  res.status(404).sendResponse({ error: 'NOT FOUND' });
});

app.listen(port, () => {
  logger.info(`${name} listening at http://localhost:${port}`);
});
