import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { WaitlistUserDatabaseService } from './db/waitlist-user.service';
import { PrismaService } from '@app/core/database/prisma.service';

@Injectable()
export class WaitlistService {
  constructor(
    private prismaService: PrismaService,
    private userWaitlistDatabaseService: WaitlistUserDatabaseService,
  ) {}
  async create(data: CreateWaitlistDto) {
    if (data.email) {
      const user = await this.prismaService.waitlistUser.findUnique({
        where: {
          email: data.email,
        },
      });

      if (user) {
        throw new BadRequestException('User is already on the waitlist');
      }
    }
    return await this.userWaitlistDatabaseService.create(data);
  }

  async findAll(filterOptions, paginationOptions) {
    try {
      const [user, totalCount] = await this.userWaitlistDatabaseService.findAll(
        filterOptions,
        paginationOptions,
      );

      return { data: user, totalCount };
    } catch (error) {
      console.error('Error fetching waitlist users:', error);
      throw new BadRequestException('Error fetching waitlist users');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} waitlist`;
  }

  update(id: number, updateWaitlistDto: UpdateWaitlistDto) {
    return `This action updates a #${id} waitlist`;
  }

  remove(id: number) {
    return `This action removes a #${id} waitlist`;
  }
}
