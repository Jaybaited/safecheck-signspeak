import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

/** Stores student photos in a PRIVATE Supabase Storage bucket and hands out short-lived signed links. */
@Injectable()
export class PhotoService {
  private get url(): string { return (process.env.SUPABASE_URL ?? '').replace(/\/$/, ''); }
  private get key(): string { return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''; }
  private get bucket(): string { return process.env.SUPABASE_PHOTO_BUCKET ?? 'student-photos'; }

  private headers() {
    return { Authorization: 'Bearer ' + this.key, apikey: this.key };
  }

  private slug(text: string): string {
    return (
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'student'
    );
  }

  /** students/<lastname>-<firstname>-<first 8 of the id>.jpg  (never contains the RFID number). */
  pathFor(userId: string, label?: string): string {
    const base = label ? this.slug(label) : 'student';
    return 'students/' + base + '-' + userId.slice(0, 8) + '.jpg';
  }

  /** Saves a JPEG (base64, with or without the data: prefix). Returns the storage path. */
  async upload(userId: string, base64: string, label?: string): Promise<string> {
    if (!this.url || !this.key) {
      throw new InternalServerErrorException('Photo storage is not configured on the server.');
    }
    const clean = base64.replace(/^data:image\/jpeg;base64,/, '');
    const buf = Buffer.from(clean, 'base64');
    if (buf.length < 500 || buf.length > 400 * 1024) {
      throw new BadRequestException('The photo must be a JPEG under 400 KB.');
    }
    if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) {
      throw new BadRequestException('The photo must be a JPEG image.');
    }
    const path = this.pathFor(userId, label);
    try {
      await axios.post(this.url + '/storage/v1/object/' + this.bucket + '/' + path, buf, {
        headers: { ...this.headers(), 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
        maxBodyLength: Infinity,
      });
    } catch (err: any) {
      console.error('Photo upload failed:', err?.response?.data ?? err?.message);
      throw new InternalServerErrorException('Could not save the photo. Please try again.');
    }
    return path;
  }

  /** Best effort: a failed delete never blocks the admin action. */
  async remove(path: string | null | undefined): Promise<void> {
    if (!path || !this.url || !this.key) return;
    try {
      await axios.delete(this.url + '/storage/v1/object/' + this.bucket + '/' + path, { headers: this.headers() });
    } catch (err: any) {
      console.error('Photo delete failed:', err?.response?.data ?? err?.message);
    }
  }

  /** A link that works for a few minutes. Returns null when there is no photo or no storage. */
  async signedUrl(path: string | null | undefined, expiresInSeconds = 300): Promise<string | null> {
    if (!path || !this.url || !this.key) return null;
    try {
      const res = await axios.post(
        this.url + '/storage/v1/object/sign/' + this.bucket + '/' + path,
        { expiresIn: expiresInSeconds },
        { headers: this.headers() },
      );
      const signed: string | undefined = res.data?.signedURL ?? res.data?.signedUrl;
      return signed ? this.url + '/storage/v1' + signed : null;
    } catch {
      return null;
    }
  }
}