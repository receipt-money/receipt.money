import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC } from 'react';
import { ContextProvider } from '../contexts/ContextProvider';
import { AppBar } from '../components/AppBar';
import { ContentContainer } from '../components/ContentContainer';
// Footer removed as requested
import Notifications from '../components/Notification'
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

const App: FC<AppProps> = ({ Component, pageProps }) => {
    return (
        <>
          <Head>
            <title>Receipt Money | Digital Receipts on Solana</title>
            <meta name="description" content="Digital receipts on Solana blockchain" />
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <ContextProvider>
            <div className="flex flex-col min-h-screen">
              <Notifications />
              <AppBar/>
              <ContentContainer>
                <Component {...pageProps} />
              </ContentContainer>
            </div>
          </ContextProvider>
        </>
    );
};

export default App;
