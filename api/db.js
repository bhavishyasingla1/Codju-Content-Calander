import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbehjvipntthyttxgutt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWhqdmlwbnR0aHl0dHhndXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUwMDU2OSwiZXhwIjoyMDk5MDc2NTY5fQ.kkdGUo8Rm8rplHLCbQpG5yfnx4Ei6sOLY-kGRJxvoz8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

export function mapToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    type: row.type,
    category: row.category || 'social',
    summary: row.summary || '',
    caption: row.caption || '',
    platform: row.platform || 'instagram',
    status: row.status,
    assets: row.assets || [],
    richText: row.rich_text || '',
    script: row.script || '',
    thumbnailAsset: row.thumbnail_asset || null,
    pdfAsset: row.pdf_asset || null,
    feedback: row.feedback || '',
    feedbackAssets: row.feedback_assets || [],
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapToDb(item) {
  if (!item) return null;
  const now = new Date().toISOString();
  const dbObj = {};
  if (item.id !== undefined) dbObj.id = item.id;
  if (item.date !== undefined) dbObj.date = item.date;
  if (item.name !== undefined) dbObj.name = item.name;
  if (item.type !== undefined) dbObj.type = item.type;
  if (item.category !== undefined) dbObj.category = item.category;
  if (item.summary !== undefined) dbObj.summary = item.summary;
  if (item.caption !== undefined) dbObj.caption = item.caption;
  if (item.platform !== undefined) dbObj.platform = item.platform;
  if (item.status !== undefined) dbObj.status = item.status;
  if (item.assets !== undefined) dbObj.assets = item.assets;
  if (item.richText !== undefined) dbObj.rich_text = item.richText;
  if (item.script !== undefined) dbObj.script = item.script;
  if (item.thumbnailAsset !== undefined) dbObj.thumbnail_asset = item.thumbnailAsset;
  if (item.pdfAsset !== undefined) dbObj.pdf_asset = item.pdfAsset;
  if (item.feedback !== undefined) dbObj.feedback = item.feedback;
  if (item.feedbackAssets !== undefined) dbObj.feedback_assets = item.feedbackAssets;
  if (item.reviewedAt !== undefined) dbObj.reviewed_at = item.reviewedAt;
  dbObj.updated_at = now;
  return dbObj;
}
