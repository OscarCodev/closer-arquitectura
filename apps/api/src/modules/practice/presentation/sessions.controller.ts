import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AuthenticatedUser } from '../../identity/domain/authenticated-user'
import { CurrentUser } from '../../identity/presentation/auth.guard'
import { DeleteSessionUseCase, GetSessionUseCase, ListSessionsUseCase, RenameSessionUseCase } from '../application/sessions.use-cases'
import { RenameSessionDto, SessionDto, SessionListDto } from './practice.dto'

@ApiTags('Sesiones de práctica')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly listSessions: ListSessionsUseCase,
    private readonly getSession: GetSessionUseCase,
    private readonly renameSession: RenameSessionUseCase,
    private readonly deleteSession: DeleteSessionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Historial: sesiones con sus intentos evaluados (en caché, últimas 60)' })
  @ApiOkResponse({ type: SessionListDto })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<SessionListDto> {
    return { sessions: (await this.listSessions.execute(user.id)).map(SessionDto.from) }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Una sesión con todos sus intentos' })
  @ApiOkResponse({ type: SessionDto })
  async get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string): Promise<SessionDto> {
    return SessionDto.from(await this.getSession.execute(user.id, id))
  }

  @Patch(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Renombra una sesión' })
  @ApiNoContentResponse()
  async rename(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameSessionDto,
  ): Promise<void> {
    await this.renameSession.execute(user.id, id, body.name)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina una sesión y sus intentos' })
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteSession.execute(user.id, id)
  }
}
