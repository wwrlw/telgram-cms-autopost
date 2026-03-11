import { PostStats, ConversionMetrics } from '../../types/index.js';

export class ConversionService {
  /**
   * @param stats
   * @param subscribersCount
   * @returns
   */
  calculateConversionMetrics(stats: PostStats | undefined, subscribersCount: number): ConversionMetrics | undefined {
    if (!stats) {
      console.log('⚠️ Нет статистики поста для расчета конверсии');
      return undefined;
    }

    const conversion: ConversionMetrics = {};
    let hasMetrics = false;

    // Копируем основные метрики для отображения
    if (stats.views !== undefined) {
      conversion.views = stats.views;
      hasMetrics = true;
    }

    if (stats.reactions !== undefined) {
      conversion.reactions = stats.reactions;
      hasMetrics = true;
    }

    if (stats.comments !== undefined) {
      conversion.comments = stats.comments;
      hasMetrics = true;
    }

    if (stats.forwards !== undefined) {
      conversion.forwards = stats.forwards;
      hasMetrics = true;
    }

    if (stats.reactions_detail) {
      conversion.reactions_detail = { ...stats.reactions_detail };
      hasMetrics = true;
    }

    if (stats.reactions !== undefined && stats.views !== undefined && stats.views > 0) {
      conversion.er = Number(((stats.reactions / stats.views) * 100).toFixed(2));
      hasMetrics = true;
    }

    if (stats.views !== undefined && subscribersCount > 0) {
      conversion.err = Number(((stats.views / subscribersCount) * 100).toFixed(2));
      hasMetrics = true;
    }

    if (hasMetrics) {
      return conversion;
    }

    console.log('⚠️ Недостаточно данных для расчета конверсии');
    return undefined;
  }

  canCalculateConversion(stats: PostStats | undefined, subscribersCount: number): boolean {
    if (!stats || subscribersCount <= 0) {
      return false;
    }

    const canCalculateER = stats.reactions !== undefined && stats.views !== undefined && stats.views > 0;
    const canCalculateERR = stats.views !== undefined;

    return canCalculateER || canCalculateERR;
  }

  logConversionMetrics(conversion: ConversionMetrics | undefined, postUrl: string): void {
    if (!conversion) {
      return;
    }

    const metrics: string[] = [];

    if (conversion.er !== undefined) {
      metrics.push(`ER: ${conversion.er}%`);
    }

    if (conversion.err !== undefined) {
      metrics.push(`ERR: ${conversion.err}%`);
    }

    if (conversion.views !== undefined) {
      metrics.push(`Просмотры: ${conversion.views}`);
    }

    if (conversion.reactions !== undefined) {
      metrics.push(`Реакции: ${conversion.reactions}`);
    }
  }
}
