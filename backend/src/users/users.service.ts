import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        rfidCard: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        rfidCard: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Use Prisma.$executeRaw with proper type casting for enums
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO users (id, username, email, password, role, "firstName", "lastName", "gradeLevel", "rfidCard", "photoUrl", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8::"GradeLevel", $9, $10, NOW(), NOW())`,
        this.generateUuid(),
        createUserDto.username,
        createUserDto.email || null,
        hashedPassword,
        createUserDto.role,
        createUserDto.firstName,
        createUserDto.lastName,
        createUserDto.gradeLevel || null,
        createUserDto.rfidCard || null,
        createUserDto.photoUrl || null
      );

      // Fetch the created user
      return this.prisma.user.findFirst({
        where: { username: createUserDto.username },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          gradeLevel: true,
          rfidCard: true,
          photoUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async update(id: string, updateData: Partial<CreateUserDto>) {
    const data: Record<string, unknown> = {};

    if (updateData.username) data.username = updateData.username;
    if (updateData.email !== undefined) data.email = updateData.email;
    if (updateData.firstName) data.firstName = updateData.firstName;
    if (updateData.lastName) data.lastName = updateData.lastName;
    if (updateData.role) data.role = updateData.role;
    if (updateData.gradeLevel !== undefined)
      data.gradeLevel = updateData.gradeLevel;
    if (updateData.rfidCard !== undefined) data.rfidCard = updateData.rfidCard;
    if (updateData.photoUrl !== undefined) data.photoUrl = updateData.photoUrl;

    if (updateData.password) {
      data.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        rfidCard: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getStats() {
    const [admins, teachers, students, parents] = await Promise.all([
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'PARENT' } }),
    ]);

    return {
      admins,
      teachers,
      students,
      parents,
      total: admins + teachers + students + parents,
    };
  }
}
