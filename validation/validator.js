export function validate(schema) {
  const errors = [], warnings = [], checks = [];
  const { db, api, ui, auth } = schema;

  // Check 1: API entities must exist in DB
  const tables = (db?.tables || []).map(t => t.name.toLowerCase());
  (api?.endpoints || []).forEach(ep => {
    if (ep.entity) {
      const found = tables.some(t =>
        t.includes(ep.entity.toLowerCase()) ||
        ep.entity.toLowerCase().includes(t.replace('s', ''))
      );
      checks.push({ pass: found, msg: `API /${ep.path} → DB table ${found ? 'found' : 'MISSING'}` });
      if (!found) errors.push(`API endpoint /${ep.path} references missing table: ${ep.entity}`);
    }
  });

  // Check 2: UI roles must exist in auth
  const roles = (auth?.roles || []).map(r =>
    (typeof r === 'string' ? r : r.name).toLowerCase()
  );
  (ui?.pages || []).forEach(page => {
    (page.access_roles || []).forEach(role => {
      const found = roles.includes(role.toLowerCase());
      checks.push({ pass: found, msg: `UI page "${page.name}" role "${role}" ${found ? 'valid' : 'UNDEFINED'}` });
      if (!found) errors.push(`UI page "${page.name}" uses undefined role: ${role}`);
    });
  });

  // Check 3: Every DB table has a primary key
  (db?.tables || []).forEach(table => {
    const hasPK = (table.columns || []).some(c => c.primary_key || c.name === 'id');
    checks.push({ pass: hasPK, msg: `Table "${table.name}" ${hasPK ? 'has' : 'MISSING'} primary key` });
    if (!hasPK) warnings.push(`Table "${table.name}" missing primary key`);
  });

  // Check 4: UI has a login/auth page
  const hasAuth = (ui?.pages || []).some(p =>
    p.name.toLowerCase().includes('login') ||
    p.name.toLowerCase().includes('auth') ||
    p.name.toLowerCase().includes('register')
  );
  checks.push({ pass: hasAuth, msg: `UI ${hasAuth ? 'has' : 'MISSING'} authentication page` });
  if (!hasAuth) warnings.push('UI missing login/register page');

  return {
    errors,
    warnings,
    checks,
    valid: errors.length === 0
  };
}
