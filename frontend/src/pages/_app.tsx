import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SEVERA // Road Accident Severity Early-Warning System</title>
        <meta name="description" content="Emergency Command Center for real-time road accident severity prediction, SHAP explainability, and triage early-warning." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-background text-slate-100 scanlines selection:bg-neon-cyan selection:text-black">
        <Component {...pageProps} />
      </main>
    </>
  );
}
