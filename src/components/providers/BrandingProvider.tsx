'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { SystemSettings } from '@/lib/services/system-config-service';

interface BrandingContextType {
    companyName: string;
    logoUrl: string;
    themeColor: string;
    isInitialized: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

/**
 * Provides corporate branding context to the client-side application.
 */
export function BrandingProvider({ 
    settings, 
    children 
}: { 
    settings: SystemSettings | null; 
    children: ReactNode;
}) {
    const value: BrandingContextType = {
        companyName: settings?.companyName || 'EGDesk',
        logoUrl: settings?.logoUrl || '',
        themeColor: settings?.themeColor || '#2563eb',
        isInitialized: settings?.isInitialized ?? false,
    };

    return (
        <BrandingContext.Provider value={value}>
            {children}
        </BrandingContext.Provider>
    );
}

/**
 * Hook to access global branding information.
 */
export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
}
