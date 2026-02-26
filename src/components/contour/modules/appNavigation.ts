/**
 * TimeMachine Contour - Quick Navigation Module
 * Parses `go <page>` command to navigate across the app.
 */

export interface NavigationResult {
    target: string;
    path: string;
    icon: string;
}

export const NAV_TARGETS: Record<string, { path: string; icon: string }> = {
    'notes': { path: '/notes', icon: 'FileText' },
    'note': { path: '/notes', icon: 'FileText' },
    'healthcare': { path: '/tm-healthcare', icon: 'HeartPulse' },
    'health': { path: '/tm-healthcare', icon: 'HeartPulse' },
    'lifestyle': { path: '/lifestyle', icon: 'Coffee' },
    'kitchen': { path: '/kitchen', icon: 'ChefHat' },
    'cook': { path: '/kitchen', icon: 'ChefHat' },
    'fashion': { path: '/fashion', icon: 'Shirt' },
    'shopping': { path: '/shopping-list', icon: 'ShoppingCart' },
    'list': { path: '/shopping-list', icon: 'ShoppingCart' },
    'calendar': { path: '/calendar', icon: 'Calendar' },
    'cal': { path: '/calendar', icon: 'Calendar' },
    'home': { path: '/', icon: 'Home' },
};

export function detectNavigation(input: string): NavigationResult | null {
    const match = input.match(/^go\s+(.+)$/i);
    if (!match) return null;

    const rawTarget = match[1].toLowerCase().trim();

    // Try exact match first
    if (NAV_TARGETS[rawTarget]) {
        return { target: rawTarget, ...NAV_TARGETS[rawTarget] };
    }

    // Try partial match
    const foundKey = Object.keys(NAV_TARGETS).find(k => rawTarget.includes(k) || k.includes(rawTarget));
    if (foundKey) {
        return { target: foundKey, ...NAV_TARGETS[foundKey] };
    }

    return null;
}
