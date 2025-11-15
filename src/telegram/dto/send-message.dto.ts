import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    type: [String],
    description: 'Array of Telegram Community chat IDs',
    example: [
      '-1002539449352',
      '-1002306607418',
      '-1002814512312',
      '-1002414675242',
      '-1002651283101',
      '-1002805775588',
      '-1002519283711',
      '-1002268273820',
      '-1002577561755',
      '-1002428293968',
      '-1002334752205',
      '-1002283708103',
      '-1002823582749',
      '-1002700389201',
      '-1002496020627',
      '-1002782540302',
      '-1002673103792',
      '-1002933177813',
      '-1002424251448',
      '-1002658614016',
      '-1002774992264',
      '-1002324380190',
      '-1002793222433',
      '-1002869884193',
      '-1002376754434',
      '-4972548544',
      '-1002580067108',
      '-1002634046443',
      '-1002726944203',
      '-1002233061343',
      '-1002660382615',
      '-1002394786535',
      '-1002635194967',
      '-1003049272013',
      '-1002600724433',
      '-1002760504801',
      '-1002833904614',
      '-1003177213052',
      '-1002991198945',
    ],
    required: true,
    maxItems: 50,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  chatIds: string[];

  @ApiProperty({
    type: String,
    description: 'message',
    example:
      "🚀 Newbot is LIVE — and it's time to earn while you learn!\n\nYou can now:\n• Study crypto in simple, fun lessons\n• Complete daily tasks and quizzes\n• Invite your friends & climb the leaderboard\n• Earn points that matter in the Newbnet ecosystem\n\nThe earlier you start, the more you stack.\nSo, what are you waiting for?\n\nTap the bot now and let's grow together",
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: String,
    description: 'message',
    example: {
      text: '👋Launch',
      webAppUrl: 'https://t.me/NewbNetBot',
      isWebApp: true,
    },
    required: false,
  })
  button?: {
    text: string;
    url: string;
    isWebApp?: boolean;
  };
}
