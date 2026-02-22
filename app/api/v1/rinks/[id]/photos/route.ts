import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { requireAuth } from '../../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../../lib/rateLimit';
import { logger, generateRequestId } from '../../../../../../lib/logger';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  try {
    const [{ rows }, countResult] = await Promise.all([
      pool.query(
        `SELECT rp.id, rp.url, rp.caption, rp.created_at, u.name AS contributor_name
         FROM rink_photos rp
         LEFT JOIN users u ON rp.user_id = u.id
         WHERE rp.rink_id = $1
         ORDER BY rp.created_at DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS total FROM rink_photos WHERE rink_id = $1',
        [id]
      ),
    ]);

    return NextResponse.json({ photos: rows, total: countResult.rows[0].total });
  } catch (err) {
    logger.error('Photos GET failed', { requestId: generateRequestId(), method: 'GET', path: '/api/v1/rinks/[id]/photos', error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'POST', path: '/api/v1/rinks/[id]/photos' };

  const limited = rateLimit(request, 5, 60_000);
  if (limited) return limited;

  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const user_id = session!.user!.id;

  try {
    const body = await request.json();
    const { image_data, caption } = body;

    if (!image_data) {
      return NextResponse.json({ error: 'image_data is required' }, { status: 400 });
    }

    // Validate base64 size
    const buffer = Buffer.from(image_data, 'base64');
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Image exceeds 5MB limit' }, { status: 400 });
    }

    // Validate MIME type via magic bytes
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    if (!isJpeg && !isPng) {
      return NextResponse.json({ error: 'Only JPEG and PNG images are allowed' }, { status: 400 });
    }
    const ext = isPng ? '.png' : '.jpg';

    // Verify rink exists
    const rinkCheck = await pool.query('SELECT id FROM rinks WHERE id = $1', [id]);
    if (rinkCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    // Save to public/uploads/rinks/
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'rinks');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Sanitize ID to prevent path traversal
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeId}-${Date.now()}${ext}`;
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/rinks/${filename}`;

    // Store in DB
    const result = await pool.query(
      `INSERT INTO rink_photos (rink_id, url, user_id, caption)
       VALUES ($1, $2, $3, $4)
       RETURNING id, url, caption, created_at`,
      [id, url, user_id, caption || null]
    );

    logger.info('Photo uploaded', { ...logCtx, rinkId: id, filename });
    return NextResponse.json({ photo: result.rows[0] });
  } catch (err) {
    logger.error('Photo upload failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
