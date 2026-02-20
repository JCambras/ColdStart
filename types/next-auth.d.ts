import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rinksRated: number;
      tipsSubmitted: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rinksRated: number;
    tipsSubmitted: number;
  }
}
