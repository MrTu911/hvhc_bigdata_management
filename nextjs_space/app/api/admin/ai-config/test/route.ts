import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import fs from 'fs';
import path from 'path';

function resolveApiKey(provider: string, requestApiKey?: string): string | null {
  if (requestApiKey) return requestApiKey;

  // Fall back to saved key in .env
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return null;

  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (provider === 'openai') {
    return envContent.match(/OPENAI_API_KEY=([^\n\r]+)/)?.[1]?.trim() || null;
  }
  if (provider === 'abacusai') {
    return envContent.match(/ABACUSAI_API_KEY=([^\n\r]+)/)?.[1]?.trim() || null;
  }
  return null;
}

// POST: Test AI connection
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, SYSTEM.MANAGE_AI_CONFIG);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { provider, apiKey: requestApiKey } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const apiKey = resolveApiKey(provider, requestApiKey);
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found — vui lòng cấu hình hoặc nhập API key để test' }, { status: 400 });
    }

    // Test connection
    const startTime = Date.now();
    let testResult: any = {};

    try {
      if (provider === 'openai') {
        // Test với OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'user', content: 'Say "Hello from HVHC BigData System"' }
            ],
            max_tokens: 50
          }),
          signal: AbortSignal.timeout(15000)
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          testResult = {
            success: true,
            provider: 'OpenAI',
            model: 'gpt-4o-mini',
            responseTime: `${responseTime}ms`,
            message: data.choices[0]?.message?.content || 'Connected successfully',
            status: 'operational'
          };
        } else {
          const errorData = await response.json().catch(() => ({}));
          testResult = {
            success: false,
            error: errorData.error?.message || 'Connection failed',
            status: 'error'
          };
        }
      } else if (provider === 'abacusai') {
        // Test với Abacus AI
        const response = await fetch('https://routellm.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            messages: [
              { role: 'user', content: 'Say "Hello from HVHC BigData System"' }
            ],
            max_tokens: 50
          }),
          signal: AbortSignal.timeout(15000)
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          testResult = {
            success: true,
            provider: 'Abacus AI',
            model: 'claude-3-5-sonnet-20241022',
            responseTime: `${responseTime}ms`,
            message: data.choices[0]?.message?.content || 'Connected successfully',
            status: 'operational'
          };
        } else {
          const errorData = await response.json().catch(() => ({}));
          testResult = {
            success: false,
            error: errorData.error?.message || 'Connection failed',
            status: 'error'
          };
        }
      } else {
        testResult = {
          success: false,
          error: 'Unknown provider',
          status: 'error'
        };
      }
    } catch (error: any) {
      testResult = {
        success: false,
        error: error.message || 'Connection timeout',
        status: 'error'
      };
    }

    return NextResponse.json(testResult);
  } catch (error: any) {
    console.error('Error testing AI connection:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}
