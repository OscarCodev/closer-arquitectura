import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RateLimit } from '../../../shared/presentation/rate-limit.guard'
import type { AuthenticatedUser } from '../../identity/domain/authenticated-user'
import { CurrentUser } from '../../identity/presentation/auth.guard'
import {
  CreateProfileUseCase,
  DeleteProfileUseCase,
  ListProfilesUseCase,
  UpdateProfileUseCase,
} from '../application/profiles.use-cases'
import { CreateProfileDto, ProfileDto, ProfileListDto, UpdateProfileDto } from './profiles.dto'

const WRITE_LIMIT = { name: 'profiles-write', limit: 60, windowSeconds: 60, message: 'Demasiados cambios de prospectos en poco tiempo.' }

@ApiTags('Prospectos')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly listProfiles: ListProfilesUseCase,
    private readonly createProfile: CreateProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly deleteProfile: DeleteProfileUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Biblioteca de prospectos del usuario (en caché)' })
  @ApiOkResponse({ type: ProfileListDto })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<ProfileListDto> {
    const profiles = await this.listProfiles.execute(user.id)
    return { profiles: profiles.map(ProfileDto.from) }
  }

  @Post()
  @RateLimit(WRITE_LIMIT)
  @ApiOperation({ summary: 'Guarda un prospecto' })
  @ApiCreatedResponse({ type: ProfileDto })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateProfileDto): Promise<ProfileDto> {
    return ProfileDto.from(await this.createProfile.execute(user.id, body))
  }

  @Patch(':id')
  @RateLimit(WRITE_LIMIT)
  @ApiOperation({ summary: 'Edita un prospecto' })
  @ApiOkResponse({ type: ProfileDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return ProfileDto.from(await this.updateProfile.execute(user.id, id, body))
  }

  @Delete(':id')
  @HttpCode(204)
  @RateLimit(WRITE_LIMIT)
  @ApiOperation({ summary: 'Elimina un prospecto' })
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteProfile.execute(user.id, id)
  }
}
