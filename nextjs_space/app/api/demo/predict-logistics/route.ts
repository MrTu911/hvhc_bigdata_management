
/**
 * Demo API - Logistics Prediction
 * Dự báo tiêu hao vật tư cho mục đích demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/demo/predict-logistics - Predict supply consumption
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, period, features } = body;

    // Simulate AI prediction for supply consumption
    const baseConsumption = Math.random() * 500 + 1000; // 1000-1500 units
    const seasonalFactor = 1 + (Math.sin(Date.now() / 1000000) * 0.2);
    const trendFactor = 1 + (Math.random() * 0.1 - 0.05);
    
    const predictedConsumption = Math.round(
      baseConsumption * seasonalFactor * trendFactor
    );

    // Current stock simulation
    const currentStock = Math.round(Math.random() * 2000 + 1000);
    const daysUntilReorder = Math.round(currentStock / (predictedConsumption / 30));
    
    // Alert level
    let alertLevel: 'safe' | 'warning' | 'critical';
    let alertColor: string;
    
    if (daysUntilReorder > 30) {
      alertLevel = 'safe';
      alertColor = 'green';
    } else if (daysUntilReorder > 15) {
      alertLevel = 'warning';
      alertColor = 'yellow';
    } else {
      alertLevel = 'critical';
      alertColor = 'red';
    }

    // Recommendations
    const recommendations: string[] = [];
    if (alertLevel === 'critical') {
      recommendations.push('🚨 ĐẶT HÀNG KHẨN CẤP - Dự trữ sắp cạn');
      recommendations.push(`Đặt hàng ít nhất ${Math.round(predictedConsumption * 1.5)} đơn vị`);
    } else if (alertLevel === 'warning') {
      recommendations.push('⚠️ Lên kế hoạch đặt hàng trong tuần tới');
      recommendations.push(`Đề xuất đặt ${Math.round(predictedConsumption)} đơn vị`);
    } else {
      recommendations.push('✅ Mức dự trữ an toàn');
      recommendations.push('Theo dõi định kỳ hàng tuần');
    }

    return NextResponse.json({
      success: true,
      prediction: {
        itemId,
        period,
        predictedConsumption,
        currentStock,
        daysUntilReorder,
        alertLevel,
        alertColor,
        optimalReorderQuantity: Math.round(predictedConsumption * 1.2),
        confidence: Math.round((82 + Math.random() * 12) * 10) / 10,
        factors: {
          historicalTrend: Math.round((trendFactor - 1) * 100 * 10) / 10,
          seasonalImpact: Math.round((seasonalFactor - 1) * 100 * 10) / 10,
          usagePattern: Math.round((Math.random() * 20 + 80) * 10) / 10,
        },
        recommendations,
        modelInfo: {
          modelName: 'Supply Consumption Forecaster v2.0',
          algorithm: 'LSTM + Prophet',
          accuracy: 0.891,
          lastTrained: new Date().toISOString(),
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in logistics prediction:', error);
    return NextResponse.json(
      { error: 'Prediction failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/demo/predict-logistics - Get demo logistics predictions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate sample supply predictions
    const supplies = [
      'Nhiên liệu',
      'Đạn dược huấn luyện',
      'Vật tư y tế',
      'Thiết bị điện tử',
      'Vật tư văn phòng',
      'Thiết bị bảo hộ',
      'Phụ tùng thay thế',
      'Thực phẩm khẩn cấp',
    ];

    const predictions = supplies.map((item, i) => {
      const consumption = Math.round(Math.random() * 1000 + 500);
      const stock = Math.round(Math.random() * 2000 + 1000);
      const days = Math.round(stock / (consumption / 30));
      
      return {
        id: `supply-${i + 1}`,
        name: item,
        predictedConsumption: consumption,
        currentStock: stock,
        daysUntilReorder: days,
        alertLevel: days > 30 ? 'safe' : days > 15 ? 'warning' : 'critical',
        confidence: Math.round((80 + Math.random() * 15) * 10) / 10,
      };
    });

    return NextResponse.json({
      success: true,
      data: predictions,
      summary: {
        total: predictions.length,
        critical: predictions.filter(p => p.alertLevel === 'critical').length,
        warning: predictions.filter(p => p.alertLevel === 'warning').length,
        safe: predictions.filter(p => p.alertLevel === 'safe').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching logistics predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions', message: error.message },
      { status: 500 }
    );
  }
}
