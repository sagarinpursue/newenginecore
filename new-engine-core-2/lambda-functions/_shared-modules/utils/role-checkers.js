export function isSuperAdmin(role) {
    return role === 'super_admin';
}

export function isAdmin(role) {
    return role === 'super_admin' || role === 'admin';
}

export function ensureIsAdmin(role) {
    if (!isAdmin(role)) {
        throw new Error('Unauthorized: Administrator privileges are required.');
    }
}
