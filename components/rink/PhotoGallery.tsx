'use client';

import { useState } from 'react';
import Image from 'next/image';
import { colors } from '../../lib/theme';

interface Photo {
  id: number;
  url: string;
  caption?: string;
  contributor_name?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  rinkId: string;
  rinkName: string;
  staticPhoto: string | null | undefined;
  currentUserId?: string;
  onPhotoAdded: (photo: Photo) => void;
}

export function PhotoGallery({ photos, rinkId, rinkName, staticPhoto, currentUserId, onPhotoAdded }: PhotoGalleryProps) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const canvas = document.createElement('canvas');
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url; });
      const maxW = 1200;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

      const res = await fetch(`/api/v1/rinks/${rinkId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: base64, user_id: currentUserId || null }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.photo) onPhotoAdded(data.photo);
      }
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
    }
  }

  const fileInput = (
    <input
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
      disabled={uploading}
    />
  );

  if (photos.length > 0) {
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8,
          scrollSnapType: 'x mandatory',
        }}>
          {photos.map((photo) => (
            <div key={photo.id} style={{
              flexShrink: 0, width: 280, height: 200,
              borderRadius: 12, overflow: 'hidden', position: 'relative',
              background: colors.borderLight, scrollSnapAlign: 'start',
            }}>
              <Image src={photo.url} alt={photo.caption || rinkName} fill style={{ objectFit: 'cover' }} sizes="280px" />
              {photo.contributor_name && (
                <div style={{
                  position: 'absolute', bottom: 6, left: 6,
                  fontSize: 10, color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(0,0,0,0.5)', padding: '2px 8px',
                  borderRadius: 4, backdropFilter: 'blur(4px)',
                }}>
                  Photo by {photo.contributor_name}
                </div>
              )}
            </div>
          ))}
        </div>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: colors.textMuted, cursor: 'pointer', marginTop: 4,
        }}>
          <span>{uploading ? 'Uploading...' : '+ Add a photo'}</span>
          {fileInput}
        </label>
      </div>
    );
  }

  if (staticPhoto) {
    return (
      <div style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', height: 220, position: 'relative', background: colors.borderLight }}>
        <Image src={staticPhoto} alt={rinkName} fill style={{ objectFit: 'contain', objectPosition: 'center' }} sizes="(max-width: 680px) 100vw, 680px" />
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          fontSize: 10, color: 'rgba(255,255,255,0.7)',
          background: 'rgba(0,0,0,0.4)', padding: '3px 8px',
          borderRadius: 6, backdropFilter: 'blur(4px)',
        }}>
          Photo from a hockey parent
        </div>
        <label style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 11, fontWeight: 600, color: '#fff',
          background: 'rgba(0,0,0,0.5)', padding: '4px 10px',
          borderRadius: 6, cursor: 'pointer', backdropFilter: 'blur(4px)',
        }}>
          {uploading ? 'Uploading...' : '+ Add photo'}
          {fileInput}
        </label>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 16, padding: '20px 16px', borderRadius: 12,
      border: `1.5px dashed ${colors.borderDefault}`, textAlign: 'center',
    }}>
      <label style={{ cursor: 'pointer' }}>
        <span style={{ fontSize: 13, color: colors.textMuted }}>
          {uploading ? 'Uploading...' : 'Be the first to add a photo of this rink'}
        </span>
        {fileInput}
      </label>
    </div>
  );
}
