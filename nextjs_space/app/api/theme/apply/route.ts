import { requireFunction } from "@/lib/rbac/middleware";
import { THEME } from "@/lib/rbac/function-codes";

import { NextResponse } from 'next/server';

// POST: Apply theme changes dynamically
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { themeConfig } = body;

    // Generate CSS variables from theme config
    const cssVars = generateCSSVariables(themeConfig);

    return NextResponse.json({
      success: true,
      data: {
        cssVars,
        message: 'Theme applied successfully'
      }
    });
  } catch (error: any) {
    console.error('Error applying theme:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateCSSVariables(themeConfig: any) {
  const vars: any = {};

  if (themeConfig.colors) {
    if (themeConfig.colors.primary) vars['--primary'] = themeConfig.colors.primary;
    if (themeConfig.colors.secondary) vars['--secondary'] = themeConfig.colors.secondary;
    if (themeConfig.colors.accent) vars['--accent'] = themeConfig.colors.accent;
    if (themeConfig.colors.success) vars['--success'] = themeConfig.colors.success;
    if (themeConfig.colors.warning) vars['--warning'] = themeConfig.colors.warning;
    if (themeConfig.colors.danger) vars['--destructive'] = themeConfig.colors.danger;
    if (themeConfig.colors.info) vars['--info'] = themeConfig.colors.info;
  }

  if (themeConfig.layout) {
    if (themeConfig.layout.sidebarWidth) vars['--sidebar-width'] = `${themeConfig.layout.sidebarWidth}px`;
    if (themeConfig.layout.headerHeight) vars['--header-height'] = `${themeConfig.layout.headerHeight}px`;
    if (themeConfig.layout.borderRadius) vars['--radius'] = `${themeConfig.layout.borderRadius}px`;
  }

  return vars;
}
