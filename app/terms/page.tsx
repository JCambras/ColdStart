import { Metadata } from 'next';
import { PageShell } from '../../components/PageShell';
import { colors, text, spacing } from '../../lib/theme';

export const metadata: Metadata = {
  title: 'Terms of Service — ColdStart Hockey',
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

export default function TermsPage() {
  return (
    <PageShell back="/">
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 64px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: '0 0 4px' }}>Terms of Service</h1>
        <p style={{ fontSize: text.sm, color: colors.textMuted, margin: '0 0 28px' }}>Effective February 23, 2026</p>

        <S>
          <H>1. Agreement</H>
          <P>
            By using ColdStart Hockey (&quot;the Service&quot;), operated by ColdStart Sports, LLC, a Pennsylvania limited liability company, you agree to these Terms of Service. If you do not agree, do not use the Service.
          </P>
        </S>

        <S>
          <H>2. The Service</H>
          <P>
            ColdStart provides crowd-sourced information about ice rinks and sports facilities, including ratings, tips, and nearby amenities. All information is contributed by users and may not reflect current conditions. ColdStart does not verify the accuracy of user contributions and is not responsible for decisions made based on this information.
          </P>
        </S>

        <S>
          <H>3. User Contributions</H>
          <P>
            When you submit ratings, tips, or other content, you grant ColdStart Sports, LLC a non-exclusive, royalty-free, worldwide license to use, display, and distribute that content as part of the Service. You represent that your contributions are truthful and based on your own experience. Do not submit content that is defamatory, misleading, or violates any law.
          </P>
        </S>

        <S>
          <H>4. Accounts</H>
          <P>
            Some features require an account. You are responsible for keeping your login credentials secure. ColdStart may suspend or terminate accounts that violate these terms.
          </P>
        </S>

        <S>
          <H>5. Rink Operator Claims</H>
          <P>
            Rink operators may claim their facility page. ColdStart reserves the right to verify claims and may reject or revoke claims at its discretion. Claimed profiles do not override user-contributed ratings or tips.
          </P>
        </S>

        <S>
          <H>6. Prohibited Conduct</H>
          <P>
            You may not: submit false or misleading ratings; attempt to manipulate ratings for any facility; scrape, crawl, or harvest data from the Service without written permission; interfere with the operation of the Service; or impersonate another person or rink operator.
          </P>
        </S>

        <S>
          <H>7. Disclaimers</H>
          <P>
            The Service is provided &quot;as is&quot; without warranties of any kind. ColdStart Sports, LLC does not guarantee the accuracy, completeness, or reliability of any user-contributed content. Facility conditions change and may differ from what is reported.
          </P>
        </S>

        <S>
          <H>8. Limitation of Liability</H>
          <P>
            To the maximum extent permitted by law, ColdStart Sports, LLC shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
          </P>
        </S>

        <S>
          <H>9. Changes</H>
          <P>
            We may update these terms. Continued use of the Service after changes constitutes acceptance.
          </P>
        </S>

        <S>
          <H>10. Contact</H>
          <P>
            Questions? Email{' '}
            <a href="mailto:rinks@coldstarthockey.com" style={{ color: colors.brandAccent, textDecoration: 'none' }}>
              rinks@coldstarthockey.com
            </a>
          </P>
        </S>
      </div>
    </PageShell>
  );
}
