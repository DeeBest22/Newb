import { Injectable } from '@nestjs/common';
import { Account, AccountType, Prisma } from '@prisma/client';
import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { pick } from '@app/core/utils/functions';
import {
  buildCreateOrUpdate,
  buildRelations,
  buildSearchQuery,
} from '@app/core/utils/db-query';
import { PrismaService } from '@app/core/database/prisma.service';
import { accountTypeMapping } from '../accounts-type.mapping';

@Injectable()
export class AccountDatabaseService extends BaseDatabaseService {
  public searchable: string[] = ['type'];
  public relations: string[] = ['users'];
  protected model: Prisma.AccountDelegate<any>;

  constructor(private readonly prisma: PrismaService) {
    super(prisma.account);
  }

  async createAccountForTelegramUser(
    userId: number,
    telegramData: {
      telegramId: bigint;
      firstName?: string;
      lastName?: string;
      username?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const model = tx ? tx.account : this.model;

    return model.create({
      data: {
        type: AccountType.GENERAL_USER,
        users: {
          connect: { id: userId },
        },
        general_user: {
          create: {
            telegramId: telegramData.telegramId,
            firstName: telegramData.firstName,
            lastName: telegramData.lastName,
            username: telegramData.username,
          },
        },
      },
    });
  }

  async findAll(
    filterOptions: {
      [key: string]: any;
      sortKey?: string;
      sortDir?: string;
    } = {},
    paginationOptions: { skip?: number; limit?: number } | null = null,
    relations: string[] = [],
  ) {
    const queryOptions: any = {};
    const { sortKey, sortDir, type, ...searchOptions } = filterOptions;
    const { skip, limit } = paginationOptions || {};
    const accountType = type as keyof typeof AccountType;
    const { searchable, relations: accountTypeRelations } =
      accountTypeMapping[accountType];

    if (limit) {
      queryOptions['take'] = Number(limit);
    }

    if (skip) {
      queryOptions['skip'] = Number(skip);
    }

    if (sortKey) {
      queryOptions['orderBy'] = {
        [sortKey]: sortDir ? sortDir : 'asc',
      };
    }

    const buildWhere: any = {
      type,
      deletedAt: null,
      [type.toLowerCase()]: buildSearchQuery(searchOptions, searchable),
    };
    queryOptions['where'] = buildWhere;

    queryOptions['include'] = {
      users: {
        include: {},
      },
      [type.toLowerCase()]: {
        include: buildRelations(relations),
      },
    };

    return Promise.all([
      this.model.findMany(queryOptions),
      this.model.count({
        where: buildWhere,
      }),
    ]);
  }

  async create(data, tx?: Prisma.TransactionClient): Promise<Account> {
    const accountType = data.accountType;
    const accountTypeRelation = AccountType[accountType].toLowerCase();

    const accountData: Prisma.AccountCreateInput = {
      type: accountType,
      [accountTypeRelation]: {
        create: buildCreateOrUpdate(
          data,
          accountTypeMapping[accountType].fillable,
        ),
      },
    };

    if (data.userId) {
      accountData.users = {
        connect: { id: data.userId },
      };
    }

    return (tx || this.prisma).account.create({
      data: accountData,
    });
  }

  async findById(id: number, relations: string[] = []) {
    return this.findFirst({ id, deletedAt: null }, relations);
  }

  async findAccountTypeData(
    accountId: number,
    accountType: keyof typeof AccountType,
    additionalRelations: string[] = [], // Accept additional relations
  ) {
    const options = {
      where: {
        id: accountId,
      },
    };

    // Merge the default and additional relations
    const relations = [
      ...accountTypeMapping[accountType].relations,
      ...additionalRelations,
    ];

    if (relations.length) {
      options['include'] = buildRelations(relations);
    }
    console.log('accountTypeMapping:', accountTypeMapping);
    console.log(
      'accountTypeMapping[accountType]:',
      accountTypeMapping[accountType],
    );
    console.log('Prisma Models:', Object.keys(this.prisma));

    return this.prisma[accountType.toLowerCase()].findUnique(options);
  }

  async update(id: number, data) {
    const account = await this.model.findUnique({
      where: { id },
    });

    if (!account) {
      throw new Error(`Account with id ${id} not found`);
    }
    const accountTypeRelation = AccountType[account.type].toLowerCase();

    return this.model.update({
      where: { id },
      data: {
        [accountTypeRelation]: {
          update: pick(data, accountTypeMapping[account.type].fillable),
        },
      },
      include: {
        users: true,
      },
    });
  }
}
