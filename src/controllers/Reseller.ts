import {
  cryptPassword,
  Logics,
  Domain,
  Utils,
  BackendTypes,
  passwordGenerator,
  Types,
  DBModels,
  objHasProp,
} from '@ikomida/shared-backend';

const host: any = {
  development: 'https://dev.reseller.ikomida.com/',
  homologation: 'https://hmlg.reseller.ikomida.com/',
  production: 'https://reseller.ikomida.com/',
}

export default class Reseller {
  randCodes;
  limit = 10;
  logger;
  host

  constructor(logger: Utils.Logger) {
    this.randCodes = new Utils.RandCodes();
    this.logger = logger;
    this.host = host[process.env.NODE_ENV ?? 'development'];
  }

  async getResellers(identity: Types.Classes.CUser, timestamp = 0) {
    try {
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESELLERS_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      let resellers;
      const where =
        timestamp && timestamp != 0 && Number(Logics.Finances.toNumber(timestamp)) == timestamp
          ? {
            createdAt: {
              [Domain.SqlDB.Op.lt]: new Date(Number(Logics.Finances.toNumber(timestamp))),
            },
          }
          : {};
      if (BackendTypes.Roles.ADMIN === role) {
        const resellerModels = await DBModels.UserModel.findAll({
          where: {
            ...{
              role: BackendTypes.Roles.RESELLER,
            },
            ...where,
          },
          order: [['createdAt', 'DESC']],
          limit: this.limit,
        });
        resellers = resellerModels.map((resellerModel) => {
          return Types.Classes.CUser.init('', resellerModel.name ?? '', resellerModel.lastName ?? '', '', resellerModel.email ?? '', resellerModel.phone ?? '', String(resellerModel.areaCode ?? ''), '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, resellerModel.avatar, undefined, undefined, undefined, resellerModel.id, resellerModel.createdAt.getTime());
        });
      } else {
        const userModel = await DBModels.UserModel.findOne({
          where: {
            id: identity.id,
          },
        });
        if (!userModel) {
          const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESELLER_INVALID_USER);
          return error.logAndReturn(this.logger);
        }
        const referralModel = await userModel.$get('referral');
        const resellerModels = await referralModel?.$get('users', {
          where,
          order: [['createdAt', 'DESC']],
          limit: this.limit,
        });
        resellers = resellerModels?.map((resellerModel) => {
          return Types.Classes.CUser.init('', resellerModel.name ?? '', resellerModel.lastName ?? '', '', resellerModel.email ?? '', resellerModel.phone ?? '', String(resellerModel.areaCode ?? ''), '', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, resellerModel.avatar, undefined, undefined, undefined, undefined, resellerModel.createdAt.getTime());
        });
      }
      return new Utils.Return(
        true,
        resellers?.sort((item1, item2) => (item2?.timestamp ?? 0) - (item1?.timestamp ?? 0)),
      );
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESELLER_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  async getContracts(identity: Types.Classes.CUser, timestamp: number) {
    try {
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESTAURANTS_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      let contracts;
      const where =
        timestamp && timestamp != 0 && Number(Logics.Finances.toNumber(timestamp)) == timestamp
          ? {
            createdAt: {
              [Domain.SqlDB.Op.lt]: new Date(Number(Logics.Finances.toNumber(timestamp))),
            },
          }
          : {};
      if (BackendTypes.Roles.ADMIN === role) {
        const contractModels = await DBModels.ContractModel.findAll({
          where,
          order: [['createdAt', 'DESC']],
          limit: this.limit,
        });
        contracts = contractModels.map((contractModel) => {
          return Types.Classes.CContract.fromObject({
            id: contractModel.id,
            contractName: contractModel.contractName,
            ikomidaID: contractModel.ikomidaID,
            createdAt: contractModel.createdAt,
            timestamp: contractModel.createdAt.getTime(),
            phone: contractModel.phone,
          });
        });
      } else {
        const userModel = await DBModels.UserModel.findOne({
          where: {
            id: identity.id,
          },
        });
        if (!userModel) {
          const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESTAURANTS_INVALID_USER);
          return error.logAndReturn(this.logger);
        }
        const referralModel = await userModel.$get('referral');
        const contractModels = await referralModel?.$get('contracts', {
          where,
          order: [['createdAt', 'DESC']],
          limit: this.limit,
        });
        contracts = contractModels?.map((contractModel) => {
          return Types.Classes.CContract.fromObject({
            contractName: contractModel.contractName,
            createdAt: contractModel.createdAt,
            timestamp: contractModel.createdAt.getTime(),
            phone: contractModel.phone,
          });
        });
      }
      return new Utils.Return(
        true,
        contracts?.sort((item1, item2) => (item2?.timestamp ?? 0) - (item1?.timestamp ?? 0)),
      );
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESTAURANTS_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  async newReseller(identity: Types.Classes.CUser, input: any) {
    try {
      const payload: Types.Classes.CUser = Types.Classes.CUser.fromObject(input)
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      if (!payload.validate() || !this.validateObject(payload)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_MISSING_DATA);
        return error.logAndReturn(this.logger);
      }
      const currentUserModel = await DBModels.UserModel.findOne({
        where: {
          id: identity.id,
        },
      });
      if (!currentUserModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_INVALID_USER);
        return error.logAndReturn(this.logger);
      }
      const userModelCount = await DBModels.UserModel.count({
        where: {
          role: BackendTypes.Roles.RESELLER,
          [Domain.SqlDB.Op.or]: [
            {
              email: payload?.email,
            },
            {
              areaCode: Logics.Finances.toNumber(payload?.areaCode),
              phone: Logics.Finances.toNumber(payload?.phone),
            },
            {
              identity: Logics.Finances.toNumber(payload?.identity),
            },
          ],
        },
      });
      if (userModelCount !== 0) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_USED_USER);
        return error.logAndReturn(this.logger);
      }
      const referralModel = await DBModels.ReferralModel.create({
        code: this.randCodes.generateOne(),
      });
      const newPassword = passwordGenerator(8);
      const userModel: DBModels.UserModel = await referralModel.$create('user', {
        role: BackendTypes.Roles.RESELLER,
        name: payload?.name,
        lastName: payload?.lastName,
        email: payload?.email,
        identity: Logics.Finances.toNumber(payload?.identity),
        phone: Logics.Finances.toNumber(payload?.phone),
        areaCode: Logics.Finances.toNumber(payload?.areaCode),
        password: (await cryptPassword(newPassword)).hash,
      });
      if (!userModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_CREATE_USER_DB_ERROR);
        return error.logAndReturn(this.logger);
      }
      if (role && [BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER].includes(role)) {
        const referredByModel = await currentUserModel.$get('referral');
        await referredByModel?.$add('users', userModel);
      }
      if (userModel) {
        try {
          const message = new Utils.Email(
            Utils.Email.RESELLER_REGISTRATION_SUCCESSFULL,
            'iKomida vendedor',
            userModel?.name,
            `${this.host}apps`,
            userModel?.phone,
            newPassword,
            'iKomida',
            this.host,
          );
          const emailPayload = new Types.Classes.CAMQPPayload<Types.Classes.CEmail>({
            method: 'send',
            object: {
              from: {
                email: `no-replay@ikomida.com`,
                name: `iKomida`,
              },
              to: {
                email: userModel?.email,
                name: `${userModel?.name} ${userModel?.lastName}`,
              },
              message,
            },
          });
          const amqp = new Domain.RabbitMQ(this.logger);
          await amqp?.publish(Domain.RabbitMQ.EMAIL_QUEUE, emailPayload);
          await amqp?.close();
        } catch (exception: any) {
          const error = new Utils.iKomidaError(
            Utils.iKomidaError.IKOMIDA_ORDERS_SERVICE_PAGSEGURO_WEBHOOK_PUSH_NOTIFICATION_EXCEPTION_2,
            exception,
          );
          error.log(this.logger);
        }
        return new Utils.Return(true);
      }
      return new Utils.Return(true);
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  async countRestaurants(identity: Types.Classes.CUser) {
    try {
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.RESELLER].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      const currentUserModel = await DBModels.UserModel.findOne({
        where: {
          id: identity.id,
        },
      });
      if (!currentUserModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_INVALID_USER);
        return error.logAndReturn(this.logger);
      }
      const referral = await currentUserModel.$get('referral');
      const referrals = await referral?.$get('contracts');
      return new Utils.Return(true, referrals?.length ?? 0);
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  async countResellers(identity: Types.Classes.CUser) {
    const bonusLevels = [5, 3, 1];
    try {
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      const currentUserModel = await DBModels.UserModel.findOne({
        where: {
          id: identity.id,
        },
      });
      if (!currentUserModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_INVALID_USER);
        return error.logAndReturn(this.logger);
      }
      const referral = await currentUserModel.$get('referral');
      let usersByReferral = (await referral?.$get('users')) ?? [];
      const referralCount = [];
      for (let index = 0; index <= bonusLevels.length; index++) {
        let newUsersByReferral: DBModels.UserModel[] = [];
        for (const userByReferral of usersByReferral) {
          const userReferral = await userByReferral.$get('referral');
          newUsersByReferral = [...newUsersByReferral, ...((await userReferral?.$get('users')) ?? [])];
        }
        referralCount.push({ level: index, count: usersByReferral?.length });
        usersByReferral = newUsersByReferral;
      }
      return new Utils.Return(true, referralCount);
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  async revuneDetails(identity: Types.Classes.CUser) {
    try {
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      const currentUserModel = await DBModels.UserModel.findOne({
        where: {
          id: identity.id,
        },
      });
      if (!currentUserModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_INVALID_USER);
        return error.logAndReturn(this.logger);
      }
      const referral = await currentUserModel.$get('referral');
      const referralRevuneModels = (await referral?.$get('referralRevunes')) ?? [];
      return new Utils.Return(
        true,
        referralRevuneModels.map((item) => {
          return {
            total: item?.total,
            revune: item?.revune,
            bonus: item?.bonus,
            bonusDetails: item?.bonusDetails,
            paid: item?.paid,
            createdAt: item?.createdAt,
          };
        }),
      );
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  async revuneTotal(identity: Types.Classes.CUser) {
    try {
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      const currentUserModel = await DBModels.UserModel.findOne({
        where: {
          id: identity.id,
        },
      });
      if (!currentUserModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_INVALID_USER);
        return error.logAndReturn(this.logger);
      }
      const referral = await currentUserModel.$get('referral');
      const referralRevuneModels = (await referral?.$get('referralRevunes')) ?? [];
      const totalRevune = referralRevuneModels.map((item) => Number(item?.revune) + Number(item?.bonus));
      return new Utils.Return(true, totalRevune.length > 0 ? totalRevune.reduce((a, b) => a + b) : 0);
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  async lastRevune(identity: Types.Classes.CUser) {
    try {
      const role = BackendTypes.Roles.valueOf(identity.role);
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_UNAUTHORIZED);
        return error.logAndReturn(this.logger);
      }
      const currentUserModel = await DBModels.UserModel.findOne({
        where: {
          id: identity.id,
        },
      });
      if (!currentUserModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_INVALID_USER);
        return error.logAndReturn(this.logger);
      }
      const referral = await currentUserModel.$get('referral');
      const referralRevuneModels = (await referral?.$get('referralRevunes')) ?? [];
      const totalRevune =
        Number(referralRevuneModels?.[0]?.revune ?? 0) + Number(referralRevuneModels?.[0]?.bonus ?? 0);
      return new Utils.Return(true, totalRevune);
    } catch (exception: any) {
      const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_EXCEPTION, exception?.message);
      return error.logAndReturn(this.logger);
    }
  }

  validateObject(object: any) {
    return objHasProp(['email', 'areaCode', 'phone', 'cpf', 'name', 'lastName'], object);
  }
}
