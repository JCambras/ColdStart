import { Metadata } from 'next';
import { PageShell } from '../../components/PageShell';
import { colors, text, spacing, pad } from '../../lib/theme';

export const metadata: Metadata = {
  title: 'Privacy Policy — ColdStart Hockey',
};

const S = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: spacing[28] }}>{children}</section>
);
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: text.sm, color: colors.textSecondary, lineHeight: 1.7, margin: '0 0 8px' }}>{children}</p>
);

export default function PrivacyPage() {
  return (
    <PageShell back="/">
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 64px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: '0 0 4px' }}>Privacy Policy</h1>
        <p style={{ fontSize: text.sm, color: colors.textMuted, margin: '0 0 28px' }}>Effective February 23, 2026</p>

        <S>
          <H>1. Who We Are</H>
          <P>
            ColdStart Hockey is operated by ColdStart Sports, LLC, a Pennsylvania limited liability company. This policy describes how we collect, use, and protect your information.
          </P>
        </S>

        <S>
          <H>2. What We Collect</H>
          <P>
            <strong>Account information:</strong> If you create an account, we store your name and email address.
          </P>
          <P>
            <strong>Contributions:</strong> Ratings, tips, and other content you submit, along with the time of submission.
          </P>
          <P>
            <strong>Usage data:</strong> Pages visited, search queries, and basic device information (browser type, screen size). We do not use third-party tracking scripts or advertising pixels.
          </P>
          <P>
            <strong>Local storage:</strong> We store preferences (saved rinks, rating history, dismissed prompts) in your browser&apos;s local storage. This data stays on your device and is not sent to our servers.
          </P>
        </S>

        <S>
          <H>3. How We Use Your Information</H>
          <P>
            We use your information to operate and improve the Service: displaying rink ratings, generating aggregated signal scores, personalizing your experience (e.g., showing rinks you&apos;ve visited), and communicating about your account.
          </P>
        </S>

        <S>
          <H>4. What We Share</H>
          <P>
            Your ratings and tips are displayed publicly as part of rink profiles, attributed to your display name or anonymously. We do not sell personal information. We may share aggregated, anonymized data (e.g., average ratings by region) with rink operators and partners.
          </P>
        </S>

        <S>
          <H>5. Data Retention</H>
          <P>
            We retain your account information as long as your account is active. Contributions remain part of aggregate scores even if your account is deleted. You may request deletion of your account and personal data by emailing us.
          </P>
        </S>

        <S>
          <H>6. Security</H>
          <P>
            We use HTTPS encryption for all data in transit and follow industry-standard practices to protect stored data. No system is perfectly secure, and we cannot guarantee absolute security.
          </P>
        </S>

        <S>
          <H>7. Children</H>
          <P>
            ColdStart is intended for use by parents and guardians. We do not knowingly collect information from children under 13. If you believe a child has submitted information, please contact us.
          </P>
        </S>

        <S>
          <H>8. Changes</H>
          <P>
            We may update this policy. We will note the effective date at the top. Continued use of the Service after changes constitutes acceptance.
          </P>
        </S>

        <S>
          <H>9. Contact</H>
          <P>
            Questions about your data? Email{' '}
            <a href="mailto:rinks@coldstarthockey.com" style={{ color: colors.brandAccent, textDecoration: 'none' }}>
              rinks@coldstarthockey.com
            </a>
          </P>
        </S>
      </div>
    </PageShell>
  );
}
