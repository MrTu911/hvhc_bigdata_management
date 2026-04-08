/**
 * AI Configuration API
 * Quản lý cấu hình AI (OpenAI, Abacus AI)
 * 
 * RBAC Migration: Legacy checkAdminPermission → Function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

// Hàm validate AI API key
async function validateApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        return { valid: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { valid: false, error: errorData.error?.message || 'Invalid API key' };
      }
    } else if (provider === 'abacusai') {
      const response = await fetch('https://routellm.abacus.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        return { valid: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { valid: false, error: errorData.error?.message || 'Invalid API key' };
      }
    }
    return { valid: false, error: 'Unknown provider' };
  } catch (error: any) {
    return { valid: false, error: error.message || 'Connection failed' };
  }
}

// GET: Lấy cấu hình AI hiện tại
export async function GET(req: NextRequest) {
  try {
    // RBAC Check: VIEW_SYSTEM_HEALTH
    const authResult = await requireFunction(req, SYSTEM.VIEW_SYSTEM_HEALTH);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    // Đọc cấu hình từ .env
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const aiProvider = envContent.match(/AI_PROVIDER=([^\n\r]+)/)?.[1] || 'none';
    const hasApiKey = envContent.includes('OPENAI_API_KEY=') || envContent.includes('ABACUSAI_API_KEY=');
    
    const modelConfig = await prisma.systemConfig.findUnique({
      where: { key: 'ai_model_config' }
    });

    let parsedModelConfig = null;
    if (modelConfig?.value) {
      try {
        parsedModelConfig = JSON.parse(modelConfig.value as string);
      } catch (e) {}
    }

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.VIEW_SYSTEM_HEALTH,
      action: 'VIEW',
      resourceType: 'AI_CONFIG',
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      provider: aiProvider,
      configured: hasApiKey && aiProvider !== 'none',
      modelConfig: parsedModelConfig || {
        model: aiProvider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 2000
      }
    });
  } catch (error: any) {
    console.error('Error getting AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Cập nhật cấu hình AI
export async function POST(req: NextRequest) {
  try {
    // RBAC Check: MANAGE_AI_CONFIG
    const authResult = await requireFunction(req, SYSTEM.MANAGE_AI_CONFIG);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const body = await req.json();
    const { provider, apiKey, model, temperature, maxTokens, validateKey } = body;

    if (!provider || !['openai', 'abacusai', 'none'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (provider !== 'none' && !apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate API key nếu được yêu cầu
    if (validateKey && provider !== 'none' && apiKey) {
      const validation = await validateApiKey(provider, apiKey);
      if (!validation.valid) {
        return NextResponse.json({ 
          error: 'API key validation failed', 
          details: validation.error 
        }, { status: 400 });
      }
    }

    // Cập nhật .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const oldProvider = envContent.match(/AI_PROVIDER=([^\n\r]+)/)?.[1] || 'none';

    envContent = envContent
      .split('\n')
      .filter(line => 
        !line.startsWith('AI_PROVIDER=') && 
        !line.startsWith('OPENAI_API_KEY=') && 
        !line.startsWith('ABACUSAI_API_KEY=')
      )
      .join('\n');

    if (provider !== 'none') {
      envContent += `\n\n# AI Configuration\nAI_PROVIDER=${provider}\n`;
      
      if (provider === 'openai') {
        envContent += `OPENAI_API_KEY=${apiKey}\n`;
      } else if (provider === 'abacusai') {
        envContent += `ABACUSAI_API_KEY=${apiKey}\n`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    // Lưu model configuration vào database
    if (model || temperature || maxTokens) {
      const modelConfigData = {
        model: model || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022'),
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 2000
      };

      await prisma.systemConfig.upsert({
        where: { key: 'ai_model_config' },
        update: { 
          value: JSON.stringify(modelConfigData),
          updatedAt: new Date()
        },
        create: {
          key: 'ai_model_config',
          value: JSON.stringify(modelConfigData),
          category: 'AI',
          description: 'AI Model Configuration'
        }
      });
    }

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_AI_CONFIG,
      action: 'UPDATE',
      resourceType: 'AI_CONFIG',
      oldValue: { provider: oldProvider },
      newValue: { provider },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'AI configuration updated successfully',
      provider,
      configured: provider !== 'none'
    });
  } catch (error: any) {
    console.error('Error updating AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Xóa cấu hình AI
export async function DELETE(req: NextRequest) {
  try {
    // RBAC Check: MANAGE_AI_CONFIG
    const authResult = await requireFunction(req, SYSTEM.MANAGE_AI_CONFIG);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const oldProvider = envContent.match(/AI_PROVIDER=([^\n\r]+)/)?.[1] || 'none';

    envContent = envContent
      .split('\n')
      .filter(line => 
        !line.startsWith('AI_PROVIDER=') && 
        !line.startsWith('OPENAI_API_KEY=') && 
        !line.startsWith('ABACUSAI_API_KEY=') &&
        line.trim() !== '# AI Configuration'
      )
      .join('\n');

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_AI_CONFIG,
      action: 'DELETE',
      resourceType: 'AI_CONFIG',
      oldValue: { provider: oldProvider },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'AI configuration removed successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting AI config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
