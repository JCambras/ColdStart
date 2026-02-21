import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { rows } = await pool.query(
      `SELECT rp.id, rp.url, rp.caption, rp.created_at, u.name AS contributor_name
       FROM rink_photos rp
       LEFT JOIN users u ON rp.user_id = u.id
       WHERE rp.rink_id = $1
       ORDER BY rp.created_at DESC`,
      [id]
    );

    return NextResponse.json({ photos: rows });
  } catch (err) {
    console.error('GET /api/v1/rinks/[id]/photos error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { image_data, caption, user_id } = body;

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
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Sanitize ID to prevent path traversal
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeId}-${Date.now()}${ext}`;
    const filePath = join(uploadsDir, filename);
    writeFileSync(filePath, buffer);

    const url = `/uploads/rinks/${filename}`;

    // Store in DB
    const result = await pool.query(
      `INSERT INTO rink_photos (rink_id, url, user_id, caption)
       VALUES ($1, $2, $3, $4)
       RETURNING id, url, caption, created_at`,
      [id, url, user_id || null, caption || null]
    );

    return NextResponse.json({ photo: result.rows[0] });
  } catch (err) {
    console.error('POST /api/v1/rinks/[id]/photos error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
