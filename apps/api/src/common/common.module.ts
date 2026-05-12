import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RolesGuard } from './guards/roles.guard';

@Module({
  providers: [PrismaService, RolesGuard],
  exports: [PrismaService, RolesGuard],
})
export class CommonModule {}
