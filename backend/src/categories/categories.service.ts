import { Injectable } from '@nestjs/common'
import { ApiException } from '../common/api-exception'
import { paginate } from '../common/pagination'
import { PaginatedResult } from '../common/response.interceptor'
import { PrismaService } from '../prisma/prisma.service'
import { toCategoryView } from '../catalog/serializers'
import { CreateCategoryDto, UpdateCategoryDto } from './dto'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, pageSize = 50): Promise<PaginatedResult<ReturnType<typeof toCategoryView>>> {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      this.prisma.foodCategory.findMany({
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.foodCategory.count(),
    ])
    return paginate(items.map((c) => toCategoryView(c)), total, page, pageSize)
  }

  async bySlug(slug: string) {
    const category = await this.prisma.foodCategory.findUnique({ where: { slug } })
    if (!category) throw ApiException.notFound('NOT_FOUND', 'Category not found.')
    return toCategoryView(category)
  }

  async byId(id: string) {
    const category = await this.prisma.foodCategory.findUnique({ where: { id } })
    if (!category) throw ApiException.notFound('NOT_FOUND', 'Category not found.')
    return toCategoryView(category)
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-')
    const category = await this.prisma.foodCategory.create({ data: { ...dto, slug } })
    return toCategoryView(category)
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.foodCategory.findUnique({ where: { id } })
    if (!existing) throw ApiException.notFound('NOT_FOUND', 'Category not found.')
    const category = await this.prisma.foodCategory.update({ where: { id }, data: dto })
    return toCategoryView(category)
  }

  async remove(id: string) {
    const existing = await this.prisma.foodCategory.findUnique({ where: { id } })
    if (!existing) throw ApiException.notFound('NOT_FOUND', 'Category not found.')
    await this.prisma.foodCategory.delete({ where: { id } })
    return { message: 'Category deleted.' }
  }
}