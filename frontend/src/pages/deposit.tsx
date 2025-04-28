import type { NextPage } from "next";
import Head from "next/head";
import { DepositView } from "../views/deposit";

const Deposit: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Deposit & Mint | Receipt Money</title>
        <meta
          name="description"
          content="Lock tokens and mint crypto receipts on Solana"
        />
      </Head>
      <DepositView />
    </div>
  );
};

export default Deposit;