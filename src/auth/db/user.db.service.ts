import { ConflictException, Injectable } from '@nestjs/common';
import { BaseDatabaseService } from '@app/core/database/base.db.service';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '@app/core/database/prisma.service';
import {
  buildFillable,
  buildRelations,
  buildSearchQuery,
} from '@app/core/utils/db-query';
import { HashingService } from '../hashing.service';

@Injectable()
export class UserDatabaseService extends BaseDatabaseService {
  public fillable: string[] = [
    'firstName',
    'lastName',
    'password',
    'isFirstLogin',
    'isTermsAccepted',
    'isActivated',
    'accounts',
    'lastLogin',
    'email',
    'phone',
  ];
  public searchable = ['firstName', 'lastName', 'email'];
  public relations = ['accounts'];
  protected model: Prisma.UserDelegate<any>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
  ) {
    super(prisma.user);
  }

  async create(
    {
      firstName,
      lastName,
      email,
      password,
      accountId,
      isTelegramUser = false,
    }: any,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const model = tx ? tx.user : this.model;

    if (!isTelegramUser && email) {
      const existingUser = await model.findFirst({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
    }

    const createData: Prisma.UserCreateInput = {
      firstName,
      lastName,
      ...(!isTelegramUser && { email }), // Only include email for non-Telegram users
      ...(!isTelegramUser &&
        password && {
          password: await this.hashingService.hashPassword(password),
        }),
      isActivated: true,
      isTermsAccepted: isTelegramUser ? true : undefined, // Telegram users auto-accept terms
    };

    if (accountId) {
      createData.accounts = {
        connect: { id: accountId },
      };
    }

    return model.create({
      data: createData,
    });
  }

  async findFirstBy(options: Prisma.UserWhereInput) {
    return this.model.findFirst({
      where: options,
      include: {
        accounts: {
          include: {
            admin: true,
            general_user: true,
          },
        },
      },
    });
  }

  async findTelegramUser(telegramId: bigint) {
    return this.prisma.generalUser.findUnique({
      where: { telegramId },
      include: {
        account: {
          include: {
            users: true,
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
    let buildWhere;
    const queryOptions = {};
    const { sortKey, sortDir, ...searchOptions } = filterOptions || {};
    const { skip, limit } = paginationOptions || {};
    relations = relations.length ? relations : this.relations;

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

    buildWhere = buildSearchQuery(searchOptions, this.searchable);
    if (searchOptions.accountId) {
      delete buildWhere.accountId;
      buildWhere = {
        ...buildWhere,
        accounts: {
          some: {
            id: searchOptions.accountId,
          },
        },
      };
    }

    if (searchOptions) {
      queryOptions['where'] = buildWhere;
    }

    buildWhere['deletedAt'] = null;

    queryOptions['include'] = buildRelations(relations);

    return Promise.all([
      this.model.findMany(queryOptions),
      this.model.count({ where: buildWhere }),
    ]);
  }

  async delete(id) {
    const dateNow = new Date();
    return this.model.update({
      where: { id },
      data: {
        deletedAt: dateNow,
      },
    });
  }

  async update(id: number, data, tx: any = null) {
    const model = tx ? tx.user : this.model;
    return model.update({
      where: { id },
      data: buildFillable(data, this.fillable),
    });
  }
}
