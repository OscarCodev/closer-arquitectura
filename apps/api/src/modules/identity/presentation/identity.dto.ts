import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty({ nullable: true, type: String }) email: string | null
  @ApiProperty() onboardingCompleted: boolean
}

export class OnboardingDto {
  @ApiProperty({ example: 'Lucía' }) @IsString() @MaxLength(200) firstName: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) role?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) roleOtherDetail?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) industry?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) industryOtherDetail?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) sellsTo?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) sellsToOtherDetail?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) experienceLevel?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) mainChallenge?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) mainChallengeOtherDetail?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) weeklyCalls?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) goalWithCloser?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) companyName?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) phone?: string
}

export class OnboardingAnswersDto extends OnboardingDto {
  @ApiProperty({ format: 'date-time' }) completedAt: string
}

export class OnboardingResponseDto {
  @ApiProperty({ type: OnboardingAnswersDto, nullable: true }) onboarding: OnboardingAnswersDto | null
}

export class DevTokenRequestDto {
  @ApiProperty({ example: 'demo@closer.test' }) @IsEmail() email: string
}

export class DevTokenResponseDto {
  @ApiProperty() accessToken: string
  @ApiProperty({ format: 'uuid' }) userId: string
  @ApiProperty() expiresIn: number
}
