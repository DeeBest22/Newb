import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendSingleMessageDto {
  @ApiProperty({
    type: String,
    description: 'Telegram Community chat Id',
    example: '-1002929484078',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  chatId: string;

  @ApiProperty({
    type: String,
    description: 'message',
    example:
      'Transmission from VORTEX ultimate GC DAO Bot 👁‍🗨🤖\n\nHey VORTEX ultimate GC Community!\nIt’s your friendly VORTEX ultimate GC DAO Bot checking in 🫡\nPumped to be part of this amazing squad! 🚀💛\n\nHere’s what I do:\n📚 Drop fun, simple crypto lessons\n🧠 You take quick quizzes\n⏱ Answer within 10 minutes = 20 points per correct answer\n🎁 Check in on the main bot to claim your points\n🗳 Plus you get to vote on what we learn next\n\nIt’s all about learning, earning, voting, and vibing together.\n\nThanks for welcoming me in. Let’s build something epic.\nYours in crypto smarts,\nVORTEX ultimate GC DAO Bot',
    // example:
    //   "🚨 BIG NEWS, NEWBNET FAM! 🎉\n\n We’ve been selected as this week’s community-nominated project on @netrahive on twitter 💜\n\n This is a huge win for us, and we couldn’t have done it without YOU! 🙌 Now it’s time to show up and show out!\n\n Here’s how YOU can participate and win 🎁:\n\n 1️⃣ Post or quote retweet about @newbnet\\_ (in English 🇬🇧)\n 2️⃣ Use hashtags: #Netrahive and #NetrahiveContest\n 3️⃣ Retweet the announcement tweet\n 4️⃣ Join their Telegram: t.me/netrahive\n\n 🏆 5 winners will receive 2 $USDC each (on Polygon)!\n ⏰ Winners announced at the end of the week!",
    //   "parse_mode": "MarkdownV2"
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
    required: true,
  })
  @IsOptional()
  @IsString()
  button?: {
    text: string;
    url: string;
    isWebApp?: boolean;
  };
}
