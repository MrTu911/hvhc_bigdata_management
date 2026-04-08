import prisma from '@/lib/db';

export interface StabilityResult {
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    name: string;
    score: number;
    weight: number;
    impact: string;
  }[];
  recommendations: string[];
  confidence: number;
}

export class StabilityAnalyzer {
  /**
   * Calculate stability index for a personnel
   */
  static async calculateStabilityIndex(userId: string): Promise<StabilityResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Related data for analysis
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate factors
    const factors = [
      {
        name: 'Thâm niên công tác',
        score: this.calculateTenureScore(user.joinDate || user.createdAt),
        weight: 0.2,
        impact: 'positive',
      },
      {
        name: 'Độ tuổi',
        score: this.calculateAgeScore(user.dateOfBirth),
        weight: 0.15,
        impact: 'neutral',
      },
      {
        name: 'Trình độ học vấn',
        score: this.calculateEducationScore(user.educationLevel),
        weight: 0.15,
        impact: 'positive',
      },
      {
        name: 'Vị trí công tác',
        score: this.calculatePositionScore(user.position),
        weight: 0.2,
        impact: 'positive',
      },
      {
        name: 'Tình trạng sức khỏe',
        score: 85, // Default, should be from health records
        weight: 0.15,
        impact: 'neutral',
      },
      {
        name: 'Hoạt động Đảng',
        score: 90, // Default, should be from party records
        weight: 0.15,
        impact: 'positive',
      },
    ];

    // Calculate overall score
    const overallScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (overallScore < 50) riskLevel = 'CRITICAL';
    else if (overallScore < 65) riskLevel = 'HIGH';
    else if (overallScore < 80) riskLevel = 'MEDIUM';

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, overallScore);

    return {
      overallScore: Math.round(overallScore),
      riskLevel,
      factors,
      recommendations,
      confidence: 0.85,
    };
  }

  /**
   * Identify risk factors for an organization unit
   */
  static async identifyRiskFactors(unitId?: string): Promise<{
    totalPersonnel: number;
    riskDistribution: { level: string; count: number }[];
    topRisks: { userId: string; name: string; score: number; reason: string }[];
  }> {
    const whereClause = unitId ? { unitId } : {};
    
    const users = await prisma.user.findMany({
      where: {
        ...whereClause,
        role: { not: 'HOC_VIEN' },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        joinDate: true,
        position: true,
      },
      take: 100,
    });

    // Simulate risk analysis
    const riskDistribution = [
      { level: 'LOW', count: Math.floor(users.length * 0.6) },
      { level: 'MEDIUM', count: Math.floor(users.length * 0.25) },
      { level: 'HIGH', count: Math.floor(users.length * 0.12) },
      { level: 'CRITICAL', count: Math.floor(users.length * 0.03) },
    ];

    return {
      totalPersonnel: users.length,
      riskDistribution,
      topRisks: [],
    };
  }

  /**
   * Predict attrition risk
   */
  static async predictAttrition(userId: string): Promise<{
    probability: number;
    timeframe: string;
    factors: string[];
  }> {
    // Simplified attrition prediction
    return {
      probability: 0.15,
      timeframe: '12 tháng',
      factors: ['Gần tuổi nghỉ hưu', 'Cơ hội thăng tiến hạn chế'],
    };
  }

  // Helper methods
  private static calculateTenureScore(joinDate: Date | null): number {
    if (!joinDate) return 50;
    const years = (Date.now() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (years >= 20) return 95;
    if (years >= 10) return 85;
    if (years >= 5) return 75;
    if (years >= 2) return 65;
    return 50;
  }

  private static calculateAgeScore(dob: Date | null): number {
    if (!dob) return 70;
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age >= 55) return 50; // Near retirement
    if (age >= 45) return 80;
    if (age >= 35) return 90;
    if (age >= 25) return 85;
    return 70;
  }

  private static calculateEducationScore(level: string | null): number {
    const scores: Record<string, number> = {
      'Tiến sĩ': 95,
      'Thạc sĩ': 85,
      'Cử nhân': 75,
      'Cao đẳng': 65,
      'Trung cấp': 55,
    };
    return scores[level || ''] || 60;
  }

  private static calculatePositionScore(position: string | null): number {
    if (!position) return 60;
    if (position.includes('Giám đốc') || position.includes('Hiệu trưởng')) return 95;
    if (position.includes('Trưởng') || position.includes('Phó')) return 85;
    if (position.includes('Giảng viên')) return 75;
    return 65;
  }

  private static generateRecommendations(factors: any[], overallScore: number): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < 70) {
      recommendations.push('Cần quan tâm đặc biệt và theo dõi thường xuyên');
    }
    
    const lowFactors = factors.filter(f => f.score < 60);
    lowFactors.forEach(f => {
      recommendations.push(`Cải thiện yếu tố: ${f.name}`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Duy trì hiệu suất làm việc hiện tại');
    }

    return recommendations;
  }
}
