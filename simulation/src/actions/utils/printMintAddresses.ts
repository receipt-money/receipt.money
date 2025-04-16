import { getMintAddresses } from '../../utils/loadMintAddresses';

/**
 * Simple utility to print the stored mint addresses
 */
function printMintAddresses() {
  const addresses = getMintAddresses();
  
  console.log('---------------------------------------');
  console.log('STORED MINT ADDRESSES');
  console.log('---------------------------------------');
  
  if (addresses.tokenMint) {
    console.log('Token Mint:', addresses.tokenMint);
  } else {
    console.log('Token Mint: Not initialized yet');
  }
  
  if (addresses.cryptoReceiptMint) {
    console.log('Crypto Receipt Mint:', addresses.cryptoReceiptMint);
  } else {
    console.log('Crypto Receipt Mint: Not initialized yet');
  }
  
  console.log('---------------------------------------');
}

// Execute the function
printMintAddresses(); 