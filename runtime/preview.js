export function generateAppPreview(schema) {
  const { db, api, ui, auth } = schema;

  const expressRoutes = (api?.endpoints || []).map(ep =>
    `${ep.method} /api/${ep.path} — auth_required: ${ep.auth_required}`
  ).join('\n');

  const reactRoutes = (ui?.pages || []).map(p =>
    `<route path="/${p.name.toLowerCase()}" component="${p.name}Page" roles="${(p.access_roles || []).join(',')}" />`
  ).join('\n');

  const prismaSchema = (db?.tables || []).map(t => {
    const cols = (t.columns || []).map(c =>
      `  ${c.name}  ${c.type}${c.primary_key ? '  @id' : ''}`
    ).join('\n');
    return `model ${t.name} {\n${cols}\n}`;
  }).join('\n\n');

  const authConfig = {
    roles: auth?.roles || [],
    permissions: auth?.permissions || []
  };

  return {
    express_routes: expressRoutes,
    react_routes: reactRoutes,
    prisma_schema: prismaSchema,
    auth_config: authConfig,
    executable: true,
    table_count: (db?.tables || []).length,
    endpoint_count: (api?.endpoints || []).length,
    page_count: (ui?.pages || []).length
  };
}