import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>receipt.money</title>
        <meta
          name="description"
          content="Digital Receipts on Solana"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
