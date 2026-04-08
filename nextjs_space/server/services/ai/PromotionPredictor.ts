import prisma from '@/lib/db';

export interface PromotionPrediction {
  userId: string;
  name: string;
  currentPosition: string;
  predictedPosition: string;
  probability: number;
  timeframe: string;
  factors: {
    name: string;
    score: number;
    contribution: number;
  }[];
  recommendations: string[];
}

export class PromotionPredictor {
  /**
   * Predict promotion potential for a specific user
   */
  static async predictPromotionPotential(userId: string): Promise<PromotionPrediction | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        facultyProfile: true,
      },
    });

    if (!user) return null;

    const factors = [
      {
        name: 'Thâm niên',
        score: this.calculateTenureScore(user.joinDate),
        contribution: 0.2,
      },
      {
        name: 'Trình độ học vấn',
        score: this.calculateEducationScore(user.educationLevel),
        contribution: 0.25,
      },
      {
        name: 'Nghiên cứu khoa học',
        score: user.facultyProfile?.publications ? Math.min(user.facultyProfile.publications * 5, 100) : 50,
        contribution: 0.2,
      },
      {
        name: 'Quân hàm hiện tại',
        score: this.calculateRankScore(user.rank),
        contribution: 0.2,
      },
      {
        name: 'Đánh giá hàng năm',
        score: 80, // Default
        contribution: 0.15,
      },
    ];

    const totalScore = factors.reduce((sum, f) => sum + f.score * f.contribution, 0);
    const probability = Math.min(totalScore / 100, 0.95);

    return {
      userId: user.id,
      name: user.name,
      currentPosition: user.position || 'Chưa xác định',
      predictedPosition: this.predictNextPosition(user.position, user.rank),
      probability: Math.round(probability * 100) / 100,
      timeframe: this.predictTimeframe(totalScore),
      factors,
      recommendations: this.generateRecommendations(factors),
    };
  }

  /**
   * Generate career path suggestions
   */
  static async generateCareerPath(userId: string): Promise<{
    currentStage: string;
    nextStages: { position: string; timeframe: string; requirements: string[] }[];
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { currentStage: 'Unknown', nextStages: [] };
    }

    return {
      currentStage: user.position || 'Cán bộ',
      nextStages: [
        {
          position: 'Phó trưởng bộ môn',
          timeframe: '2-3 năm',
          requirements: ['Thạc sĩ trở lên', '5 năm kinh nghiệm', '3 công bố khoa học'],
        },
        {
          position: 'Trưởng bộ môn',
          timeframe: '5-7 năm',
          requirements: ['Tiến sĩ', '10 năm kinh nghiệm', '5 công bố khoa học'],
        },
        {
          position: 'Phó Trưởng khoa',
          timeframe: '8-10 năm',
          requirements: ['Tiến sĩ', 'PGS/GS', '15 năm kinh nghiệm'],
        },
      ],
    };
  }

  /**
   * Identify high-potential personnel
   */
  static async identifyHighPotential(unitId?: string, limit = 10): Promise<PromotionPrediction[]> {
    const whereClause = unitId ? { unitId } : {};
    
    const users = await prisma.user.findMany({
      where: {
        ...whereClause,
        role: { not: 'HOC_VIEN' },
        status: 'ACTIVE',
      },
      include: {
        facultyProfile: true,
      },
      take: 50,
    });

    const predictions: PromotionPrediction[] = [];

    for (const user of users) {
      const prediction = await this.predictPromotionPotential(user.id);
      if (prediction && prediction.probability >= 0.7) {
        predictions.push(prediction);
      }
    }

    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, limit);
  }

  // Helper methods
  private static calculateTenureScore(joinDate: Date | null): number {
    if (!joinDate) return 40;
    const years = (Date.now() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (years >= 15) return 90;
    if (years >= 10) return 80;
    if (years >= 5) return 70;
    if (years >= 3) return 55;
    return 40;
  }

  private static calculateEducationScore(level: string | null): number {
    const scores: Record<string, number> = {
      'Tiến sĩ': 100,
      'Thạc sĩ': 80,
      'Cử nhân': 60,
      'Cao đẳng': 45,
    };
    return scores[level || ''] || 50;
  }

  private static calculateRankScore(rank: string | null): number {
    if (!rank) return 50;
    if (rank.includes('Đại tá') || rank.includes('Thiếu tướng')) return 95;
    if (rank.includes('Thượng tá')) return 85;
    if (rank.includes('Trung tá')) return 75;
    if (rank.includes('Thiếu tá')) return 65;
    if (rank.includes('Đại úy')) return 55;
    return 45;
  }

  private static predictNextPosition(current: string | null, rank: string | null): string {
    if (!current) return 'Cán bộ chuyên môn';
    if (current.includes('Giảng viên')) return 'Phó Trưởng bộ môn';
    if (current.includes('Phó Trưởng bộ môn')) return 'Trưởng bộ môn';
    if (current.includes('Trưởng bộ môn')) return 'Phó Trưởng khoa';
    if (current.includes('Phó Trưởng khoa')) return 'Trưởng khoa';
    return 'Vị trí quản lý';
  }

  private static predictTimeframe(score: number): string {
    if (score >= 85) return '1-2 năm';
    if (score >= 70) return '2-3 năm';
    if (score >= 55) return '3-5 năm';
    return '5+ năm';
  }

  private static generateRecommendations(factors: any[]): string[] {
    const recommendations: string[] = [];
    const lowFactors = factors.filter(f => f.score < 60);

    lowFactors.forEach(f => {
      if (f.name === 'Trình độ học vấn') {
        recommendations.push('Cân nhắc học nâng cao trình độ (Thạc sĩ/Tiến sĩ)');
      }
      if (f.name === 'Nghiên cứu khoa học') {
        recommendations.push('Tăng cường hoạt động nghiên cứu và công bố khoa học');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Tiếp tục phát huy thành tích hiện tại');
    }

    return recommendations;
  }
}
