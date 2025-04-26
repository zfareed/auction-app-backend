import { IsNotEmpty, IsString, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  startingPrice: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  auctionEndTime: Date;
} 