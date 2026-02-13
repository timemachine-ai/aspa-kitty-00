import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'TimeMachine Chat';
const BASE_URL = 'https://timemachinechat.com';
const DEFAULT_DESCRIPTION = 'TimeMachine Chat is an AI-powered chat app with multiple personas including ChatGPT, Gemini, Claude, and Grok. Chat with different AI personalities, generate images, and collaborate in group chats.';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — AI Chat with Multiple Personas`;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
