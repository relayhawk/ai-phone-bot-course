import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import type { AppProps } from "next/app";
import Layout from '../components/Layout';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider maxSnack={3}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}
