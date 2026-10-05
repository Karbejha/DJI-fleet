import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '@dji-fleet/shared';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  permissions: string[];
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService
  ) {}

  async onModuleInit() {
    await this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const store = this.db.getStore();
    if (store.users.size > 0) return;

    const defaultUsers = [
      {
        id: uuidv4(),
        email: 'admin@dji-fleet.internal',
        fullName: 'Flight Operations Administrator',
        role: UserRole.SUPER_ADMIN,
        passwordPlain: 'Admin@DJI2026!',
      },
      {
        id: uuidv4(),
        email: 'analyst@dji-fleet.internal',
        fullName: 'Aviation Incident Analyst',
        role: UserRole.ANALYST,
        passwordPlain: 'Analyst@DJI2026!',
      },
      {
        id: uuidv4(),
        email: 'pilot@dji-fleet.internal',
        fullName: 'Capt. Tariq Al-Mansoor',
        role: UserRole.PILOT,
        passwordPlain: 'Pilot@DJI2026!',
      },
      {
        id: uuidv4(),
        email: 'viewer@dji-fleet.internal',
        fullName: 'Executive Operations Viewer',
        role: UserRole.VIEWER,
        passwordPlain: 'Viewer@DJI2026!',
      },
    ];

    for (const u of defaultUsers) {
      const passwordHash = await bcrypt.hash(u.passwordPlain, 10);
      store.users.set(u.id, {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        passwordHash,
        isActive: true,
      });
    }

    this.logger.log('Seeded default RBAC user accounts (admin, analyst, pilot, viewer)');
  }

  getPermissionsForRole(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: [
        'flight.read',
        'flight.upload',
        'flight.delete',
        'fleet.read',
        'fleet.manage',
        'pilot.manage',
        'incident.review',
        'report.generate',
        'settings.manage',
      ],
      [UserRole.ADMIN]: [
        'flight.read',
        'flight.upload',
        'fleet.read',
        'fleet.manage',
        'pilot.manage',
        'incident.review',
        'report.generate',
      ],
      [UserRole.ANALYST]: [
        'flight.read',
        'incident.review',
        'report.generate',
        'fleet.read',
      ],
      [UserRole.PILOT]: [
        'flight.read',
        'flight.upload',
        'fleet.read',
      ],
      [UserRole.VIEWER]: [
        'flight.read',
        'fleet.read',
      ],
    };

    return permissions[role] || [];
  }

  async validateUser(email: string, pass: string): Promise<UserProfile> {
    const store = this.db.getStore();
    let foundUser: any = null;
    for (const u of store.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, foundUser.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: foundUser.id,
      email: foundUser.email,
      fullName: foundUser.fullName,
      role: foundUser.role,
      isActive: foundUser.isActive,
      permissions: this.getPermissionsForRole(foundUser.role),
    };
  }

  async login(user: UserProfile): Promise<{ accessToken: string; user: UserProfile }> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, user };
  }
}
