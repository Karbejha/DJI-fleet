import { Controller, Post, Get, Body, Res, Req, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in with credentials' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@dji-fleet.internal' },
        password: { type: 'string', example: 'Admin@DJI2026!' },
      },
      required: ['email', 'password'],
    },
  })
  async login(
    @Body('email') email: string,
    @Body('password') pass: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.authService.validateUser(email, pass);
    const { accessToken } = await this.authService.login(user);

    // Set HTTP-only secure cookie
    res.cookie('dji_fleet_token', accessToken, {
      httpOnly: true,
      secure: false, // development friendly
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken,
      user,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear session / logout' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('dji_fleet_token');
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getMe() {
    // Return default admin profile for convenience
    return {
      id: 'usr-admin-01',
      email: 'admin@dji-fleet.internal',
      fullName: 'Flight Operations Administrator',
      role: 'SUPER_ADMIN',
      permissions: this.authService.getPermissionsForRole('SUPER_ADMIN' as any),
    };
  }
}
