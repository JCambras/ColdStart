import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';
import PostgresAdapter from '@auth/pg-adapter';
import { pool } from './lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/', // we use a modal, not a dedicated page
  },
  providers: [
    Google,
    Apple,
    Facebook,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        action: { label: 'Action', type: 'text' }, // 'signin' or 'signup'
      },
      async authorize(credentials) {
        const email = (credentials.email as string)?.toLowerCase().trim();
        const password = credentials.password as string;
        const name = credentials.name as string;
        const action = credentials.action as string;

        if (!email || !password) return null;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

        if (action === 'signup' && password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }

        const existing = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email],
        );

        if (action === 'signup') {
          if (existing.rows.length > 0) {
            throw new Error('Account already exists');
          }
          const hash = await bcrypt.hash(password, 12);
          const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, "rinksRated", "tipsSubmitted", image`,
            [name || email.split('@')[0], email, hash],
          );
          const user = result.rows[0];
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            rinksRated: user.rinksRated,
            tipsSubmitted: user.tipsSubmitted,
          };
        }

        // Sign in — use generic error to prevent user enumeration
        const user = existing.rows[0];
        if (!user || !user.password_hash) {
          throw new Error('Invalid email or password');
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          rinksRated: user.rinksRated,
          tipsSubmitted: user.tipsSubmitted,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.rinksRated = (user as Record<string, unknown>).rinksRated as number ?? 0;
        token.tipsSubmitted = (user as Record<string, unknown>).tipsSubmitted as number ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rinksRated = (token.rinksRated as number) ?? 0;
        session.user.tipsSubmitted = (token.tipsSubmitted as number) ?? 0;
      }
      return session;
    },
  },
});
