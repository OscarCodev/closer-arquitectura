import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import type { ProspectProfile } from '../domain/prospect-profile'

export class CreateProfileDto {
  @ApiPropertyOptional({ example: 'Lucía — Nubia Retail' }) @IsOptional() @IsString() @MaxLength(120) name?: string
  @ApiProperty({ example: 'Lucía Fernández, Head of Sales en Nubia Retail…' }) @IsString() @MaxLength(1400) prospect: string
  @ApiProperty({ example: 'Vendo FlowCRM, un CRM para equipos comerciales…' }) @IsString() @MaxLength(1400) context: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) personName?: string
  @ApiPropertyOptional({ example: 'Head of Sales en Nubia Retail' }) @IsOptional() @IsString() @MaxLength(200) roleCompany?: string
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}

export class ProfileDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() name: string
  @ApiProperty() prospect: string
  @ApiProperty() context: string
  @ApiPropertyOptional() personName?: string
  @ApiPropertyOptional() roleCompany?: string
  @ApiProperty({ format: 'date-time' }) createdAt: string
  @ApiProperty({ format: 'date-time' }) updatedAt: string

  static from(profile: ProspectProfile): ProfileDto {
    return {
      id: profile.id,
      name: profile.name,
      prospect: profile.prospect,
      context: profile.context,
      personName: profile.personName ?? undefined,
      roleCompany: profile.roleCompany ?? undefined,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }
  }
}

export class ProfileListDto {
  @ApiProperty({ type: [ProfileDto] }) profiles: ProfileDto[]
}
