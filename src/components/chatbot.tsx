'use client';

import Script from 'next/script';

export default function Chatbot() {
  return (
    <>
      <Script src="https://cdn.botpress.cloud/webchat/v3.3/inject.js" strategy="afterInteractive" />
      <Script
        src="https://files.bpcontent.cloud/2025/11/13/16/20251113160224-AMGGK3M5.js"
        strategy="afterInteractive"
        defer
      />
    </>
  );
}
