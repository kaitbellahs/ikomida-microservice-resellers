# ikomida-microservice-resellers

Reseller accounts and payout details.

> Part of the **iKomida** platform. See **[ikomida-k8s-config](https://github.com/kaitbellahs/ikomida-k8s-config)** for the architecture overview of all 31 repositories.

---

## Role

Resellers introduce restaurants to the platform and earn on what those restaurants transact. This service owns the reseller record, the restaurants attributed to them, and the bank details their commission is paid into. Attribution and revenue calculation happen in [job-referral](https://github.com/kaitbellahs/ikomida-job-referral).

## Endpoints

As declared in the [gateway route table](https://github.com/kaitbellahs/ikomida-microservice-gateway/blob/dev/src/routes.ts) (8 routes reach this service):

| Method | Path | Roles |
|---|---|---|
| `POST` | `/reseller` | RESELLER, VENDOR, ADMIN |
| `GET` | `/resellers/:timestamp` | RESELLER, VENDOR, ADMIN |
| `GET` | `/restaurants/:timestamp` | RESELLER, VENDOR, ADMIN |
| `POST` | `/reseller/*` | RESELLER, VENDOR, ADMIN |
| `PATCH` | `/reseller/*` | RESELLER, VENDOR, ADMIN |
| `GET` | `/reseller/*` | RESELLER, VENDOR, ADMIN |
| `PUT` | `/reseller/*` | RESELLER, VENDOR, ADMIN |
| `DELETE` | `/reseller/*` | RESELLER, VENDOR, ADMIN |

## Stack

TypeScript (ESM) · Express · Sequelize · rollup · Docker · Kubernetes

Depends on [`@ikomida/shared-types`](https://github.com/kaitbellahs/ikomida-shared-types), [`@ikomida/shared-backend`](https://github.com/kaitbellahs/ikomida-shared-backend) and [`@ikomida/shared-logics`](https://github.com/kaitbellahs/ikomida-shared-logics).

## Build

```bash
yarn install
yarn build      # rollup bundle
yarn service    # run locally
```

## Status

Built in 2022. The platform is no longer deployed; this repository is published as a record of the work. **The commit history predates generative AI coding assistants.**

## License

Licensed under the [Apache License 2.0](LICENSE) — free for commercial use, provided the copyright notice and [NOTICE](NOTICE) are retained.

Copyright 2022 Khalid Ait Bellahs.
