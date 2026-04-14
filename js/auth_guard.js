import { supabase } from './supabase.js';

(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const protectedPaths = ['/dashboard.html', '/test.html'];

    if (!session && protectedPaths.some(path => window.location.pathname.endsWith(path))) {
        window.location.replace('auth.html');
    }
})();
