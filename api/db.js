import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.nbehjvipntthyttxgutt:Codjucontentcalander%40123%24@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

export const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export function mapToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    type: row.type,
    summary: row.summary || '',
    caption: row.caption || '',
    platform: row.platform || 'instagram',
    status: row.status,
    assets: row.assets || [],
    richText: row.rich_text || '',
    script: row.script || '',
    thumbnailAsset: row.thumbnail_asset || null,
    pdfAsset: row.pdf_asset || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
