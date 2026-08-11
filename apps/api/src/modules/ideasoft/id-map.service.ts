import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

/**
 * Ideasoft integer ID ↔ Sadoksan cuid eşleme servisi.
 *
 * Entegra tüm kayıtları integer ID ile tanır. Bu servis:
 *  - forward: cuid → integer (yoksa entity_type başına artan yeni ID tahsis eder)
 *  - reverse: integer → cuid (Entegra ID ile sorgulayınca)
 *
 * Legacy (eski Ideasoft) ID'leri `ideasoft_legacy_id`'de; yeni ID'ler
 * `ideasoft_id_mapping`'de. Yeni tahsis, iki tablodaki max'ın üstünden başlar.
 * Tahsis, advisory lock ile yarış-güvenli yapılır.
 */
export type IdeasoftEntity =
  | 'order'
  | 'order_item'
  | 'member'
  | 'product'
  | 'product_detail'
  | 'billing_address'
  | 'shipping_address'
  | 'shipment'
  | 'current_account'
  | 'category'
  | 'brand';

// Advisory lock namespace'i (sabit); ikinci arg entity_type hash'i
const LOCK_NS = 48231;

@Injectable()
export class IdMapService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tek cuid → integer Ideasoft ID (yoksa tahsis eder). */
  async toIdeasoftId(entity: IdeasoftEntity, cuid: string): Promise<number> {
    const map = await this.resolveMany(entity, [cuid]);
    return map.get(cuid)!;
  }

  /**
   * Toplu cuid → integer eşleme. Var olanları tek sorguda çeker, eksikleri tahsis eder.
   * Dönüş: cuid → ideasoftId Map.
   */
  async resolveMany(
    entity: IdeasoftEntity,
    cuids: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    const unique = [...new Set(cuids.filter(Boolean))];
    if (unique.length === 0) return result;

    // 1) Mevcut yeni eşlemeler
    const existing = await this.prisma.ideasoftIdMapping.findMany({
      where: { entityType: entity, sadoksanId: { in: unique } },
      select: { sadoksanId: true, ideasoftId: true },
    });
    for (const r of existing) result.set(r.sadoksanId, r.ideasoftId);

    // 2) Legacy eşlemeler (yeni tabloda olmayanlar için)
    const stillMissing = unique.filter((id) => !result.has(id));
    if (stillMissing.length > 0) {
      const legacy = await this.prisma.ideasoftLegacyId.findMany({
        where: { entityType: entity, sadoksanId: { in: stillMissing } },
        select: { sadoksanId: true, legacyIdeasoftId: true },
      });
      for (const r of legacy) result.set(r.sadoksanId, r.legacyIdeasoftId);
    }

    // 3) Hâlâ eksik olanlara yeni ID tahsis et
    const toAllocate = unique.filter((id) => !result.has(id));
    for (const cuid of toAllocate) {
      result.set(cuid, await this.allocate(entity, cuid));
    }
    return result;
  }

  /** integer Ideasoft ID → Sadoksan cuid (yeni veya legacy). */
  async toSadoksanId(
    entity: IdeasoftEntity,
    ideasoftId: number,
  ): Promise<string | null> {
    const m = await this.prisma.ideasoftIdMapping.findUnique({
      where: { entityType_ideasoftId: { entityType: entity, ideasoftId } },
      select: { sadoksanId: true },
    });
    if (m) return m.sadoksanId;
    const l = await this.prisma.ideasoftLegacyId.findUnique({
      where: {
        entityType_legacyIdeasoftId: {
          entityType: entity,
          legacyIdeasoftId: ideasoftId,
        },
      },
      select: { sadoksanId: true },
    });
    return l?.sadoksanId ?? null;
  }

  /** Birden çok integer ID → cuid. */
  async toSadoksanIds(
    entity: IdeasoftEntity,
    ideasoftIds: number[],
  ): Promise<Map<number, string>> {
    const out = new Map<number, string>();
    const unique = [...new Set(ideasoftIds.filter((n) => Number.isFinite(n)))];
    if (unique.length === 0) return out;
    const rows = await this.prisma.ideasoftIdMapping.findMany({
      where: { entityType: entity, ideasoftId: { in: unique } },
      select: { sadoksanId: true, ideasoftId: true },
    });
    for (const r of rows) out.set(r.ideasoftId, r.sadoksanId);
    const missing = unique.filter((n) => !out.has(n));
    if (missing.length > 0) {
      const legacy = await this.prisma.ideasoftLegacyId.findMany({
        where: { entityType: entity, legacyIdeasoftId: { in: missing } },
        select: { sadoksanId: true, legacyIdeasoftId: true },
      });
      for (const r of legacy) out.set(r.legacyIdeasoftId, r.sadoksanId);
    }
    return out;
  }

  /**
   * Yeni ID tahsis et — advisory lock ile yarış-güvenli.
   * entity_type başına (yeni ∪ legacy) max + 1.
   */
  private async allocate(
    entity: IdeasoftEntity,
    cuid: string,
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      // Aynı entity_type için eşzamanlı tahsisleri serileştir
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_NS}::int, hashtext(${entity}))`;

      // Başka bir istek bu cuid'yi bu arada eşlemiş olabilir → tekrar bak
      const again = await tx.ideasoftIdMapping.findUnique({
        where: {
          entityType_sadoksanId: { entityType: entity, sadoksanId: cuid },
        },
        select: { ideasoftId: true },
      });
      if (again) return again.ideasoftId;

      const [{ max: maxNew }] = await tx.$queryRaw<{ max: number | null }[]>`
        SELECT MAX("ideasoftId") AS max FROM "ideasoft_id_mapping" WHERE "entityType" = ${entity}`;
      const [{ max: maxLegacy }] = await tx.$queryRaw<{ max: number | null }[]>`
        SELECT MAX("legacyIdeasoftId") AS max FROM "ideasoft_legacy_id" WHERE "entityType" = ${entity}`;

      const next = Math.max(Number(maxNew ?? 0), Number(maxLegacy ?? 0)) + 1;
      await tx.ideasoftIdMapping.create({
        data: { entityType: entity, sadoksanId: cuid, ideasoftId: next },
      });
      return next;
    });
  }
}
