import { Logics, Domain, Utils, BackendTypes, Types, DBModels, objHasProp } from '@ikomida/shared-backend'

export default class UserBankAccount {
  limit = 10
  logger

  constructor(logger: Utils.Logger) {
    this.logger = logger
  }

  async getUserBankAccounts(identity: Types.Classes.CUser, timestamp: number) {
    try {
      const role = BackendTypes.Roles.valueOf(identity.role)
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESELLERS_UNAUTHORIZED)
        return error.logAndReturn(this.logger)
      }
      let userPIXKeyModels
      const where =
        timestamp && timestamp != 0 && Number(Logics.Finances.toNumber(timestamp)) == timestamp
          ? {
            createdAt: {
              [Domain.SqlDB.Op.lt]: new Date(Number(Logics.Finances.toNumber(timestamp)))
            }
          }
          : {}
      if (BackendTypes.Roles.ADMIN === role) {
        userPIXKeyModels = await DBModels.UserPIXKeyModel.findAll({
          where,
          order: [['createdAt', 'DESC']],
          limit: this.limit
        })
      } else {
        const userModel = await DBModels.UserModel.findOne({
          where: {
            id: identity.id
          },
          include: {
            model: DBModels.UserPIXKeyModel,
            required: false,
            where
          }
        })
        if (!userModel) {
          const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESELLER_INVALID_USER)
          return error.logAndReturn(this.logger)
        }
        userPIXKeyModels = userModel?.userPIXKeys
      }
      const bankAccounts = userPIXKeyModels?.map(userPIXKeyModel => {
        return Types.Classes.CPix.init(
          userPIXKeyModel.name ?? '',
          userPIXKeyModel.type ?? Types.Types.TPIX.CPF,
          userPIXKeyModel.key,
          userPIXKeyModel.bank,
          String(userPIXKeyModel.agency ?? ''),
          String(userPIXKeyModel.account ?? ''),
          userPIXKeyModel.note,
          userPIXKeyModel.status,
          userPIXKeyModel.createdAt,
          userPIXKeyModel.id,
          userPIXKeyModel.createdAt.getTime()
        )
      })
      return new Utils.Return(
        true,
        bankAccounts?.sort((item1, item2) => (item2?.timestamp ?? 0) - (item1?.timestamp ?? 0))
      )
    } catch (exception: any) {
      const error = new Utils.iKomidaError(
        Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_GET_RESELLER_EXCEPTION,
        exception?.message
      )
      return error.logAndReturn(this.logger)
    }
  }

  async newUserBankAccount(identity: Types.Classes.CUser, input: any) {
    try {
      const payload: Types.Classes.CPix = Types.Classes.CPix.fromObject(input)
      const role = BackendTypes.Roles.valueOf(identity.role)
      if (!role || ![BackendTypes.Roles.VENDOR, BackendTypes.Roles.RESELLER, BackendTypes.Roles.ADMIN].includes(role)) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_UNAUTHORIZED)
        return error.logAndReturn(this.logger)
      }
      if (!payload.validate()) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_MISSING_DATA)
        return error.logAndReturn(this.logger)
      }
      const currentUserModel = await DBModels.UserModel.findOne({
        where: {
          id: identity.id
        }
      })
      if (!currentUserModel) {
        const error = new Utils.iKomidaError(Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_INVALID_USER)
        return error.logAndReturn(this.logger)
      }
      const userPIXKeyModel: DBModels.UserPIXKeyModel = await currentUserModel.$create('userPIXKey', {
        name: payload?.name,
        type: payload?.kind,
        key: payload?.key,
        bank: payload?.bank,
        agency: payload?.agency,
        account: payload?.account,
        status: Types.Types.TransactionStatus.PENDING.id
      })
      const userPIXKey: Types.Classes.CPix = Types.Classes.CPix.init(
        userPIXKeyModel.name ?? '',
        userPIXKeyModel.type ?? Types.Types.TPIX.EVP,
        userPIXKeyModel.key,
        userPIXKeyModel.bank,
        `${userPIXKeyModel.agency}`,
        `${userPIXKeyModel.account}`,
        userPIXKeyModel.note,
        userPIXKeyModel.status,
        userPIXKeyModel.createdAt,
        userPIXKeyModel.id,
        userPIXKeyModel.createdAt.getTime()
      )
      return new Utils.Return(true, userPIXKey)
    } catch (exception: any) {
      const error = new Utils.iKomidaError(
        Utils.iKomidaError.IKOMIDA_RESELLER_SERVICE_NEW_RESELLER_EXCEPTION,
        exception?.message
      )
      return error.logAndReturn(this.logger)
    }
  }
}
