import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateBidDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
} 