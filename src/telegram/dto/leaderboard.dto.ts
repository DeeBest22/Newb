import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendLeaderboardDto {
  @ApiProperty({
    description: 'The ID of the chat (channel or group) to send the quiz to.',
    example: '-1002805775588',
  })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({
    description: 'The leaderboard data formatted as a string.',
    example:
      'AMBASSADORS LEADERBOARD\n\n1.@Abdul_rasak321-1000p\n2.@Airda_Reyes-520P\n3.@milodot56-510p\n4.@0x_damii-1000p\n5.@EmpathicDesgnr\n6.@onchain_fiend\n7.@Nova_w3b\n8.@kamdifunds\n9.@eeazyyy_\n10.@defi_kwin\n11.@DeborahDoherty0\n12.@Wensyofweb3\n13.@WEB3_Tinaa\n14.@OnomeofWeb3\n15.@Defi_francis\n16.@txniia__\n17.@Fan_Tasy0\n18.@Hikmahcodes\n19.@Demind360\n20.@sarahh_ogg\n21.@Linto_Jnr\n22.@TheWeb3Anniiee',
  })
  @IsString()
  @IsNotEmpty()
  leaderboard: string;
}
