import { NextResponse } from 'next/server';
import { admin, check } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
export async function POST(req: Request) {
  try {
    origin(req);
    const client = await admin();
    const form = await req.formData();
    const file = form.get('file');
    if (
      !(file instanceof File) ||
      file.size > 5242880 ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    )
      throw new Error('Upload a JPEG, PNG or WebP up to 5 MB');
    const bytes = Buffer.from(await file.arrayBuffer());
    const valid =
      file.type === 'image/jpeg'
        ? bytes[0] === 255 && bytes[1] === 216
        : file.type === 'image/png'
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP';
    if (!valid) throw new Error('Invalid image');
    const path = `${crypto.randomUUID()}.${file.type.split('/')[1]}`;
    check(
      (
        await client.storage
          .from('products')
          .upload(path, bytes, { contentType: file.type })
      ).error,
    );
    return NextResponse.json({
      url: client.storage.from('products').getPublicUrl(path).data.publicUrl,
    });
  } catch (e) {
    return failure(e);
  }
}
