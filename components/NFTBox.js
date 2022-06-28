import React, { useEffect, useState } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import nftAbi from "../constants/BasicNft.json";
import { Card, useNotification } from "web3uikit";
import { ethers } from "ethers";
import UpdateListingModal from "./UpdateListingModal";

const truncateString = (fullStr, strLen) => {
  if (fullStr.length <= strLen) return fullStr;

  const separator = "...";
  let separatorLength = separator.length;
  const charsToShow = strLen - separatorLength;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return (
    fullStr.substring(0, frontChars) +
    separator +
    fullStr.substring(fullStr.length - backChars)
  );
};

export const NFTBox = ({
  price,
  nftAddress,
  tokenId,
  marketplaceAddress,
  seller,
}) => {
  const [imageURI, setImageURI] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [showModal, setShowModal] = useState(false);
  const hideModal = () => {
    setShowModal(false);
  }

  const dispatch = useNotification()

  const { isWeb3Enabled, account } = useMoralis();
  const { runContractFunction: getTokenURI } = useWeb3Contract({
    abi: nftAbi,
    contractAddress: nftAddress,
    functionName: "tokenURI",
    params: {
      tokenId: tokenId,
    },
  });

  const { runContractFunction: buyItem } = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "buyItem",
    msgValue: price,
    params: {
      nftAddress: nftAddress,
      tokenId: tokenId
    },
  });

  async function updateUI() {
    const tokenURI = await getTokenURI();
    console.log(`The tokenURI is ${tokenURI}`);
    if (tokenURI) {
      const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      const tokenURIResponse = await (await fetch(requestURL)).json();

      const imageURI = tokenURIResponse.image;
      const imageURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      setImageURI(imageURL);
      setTokenName(tokenURIResponse.name);
      setTokenDescription(tokenURIResponse.description);
    }
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    }
  }, [isWeb3Enabled]);
  
  const isOwnedByUser = seller === account || seller === undefined;
  const formattedSellerAddress = isOwnedByUser
    ? "you"
    : truncateString(seller || "", 15);

  const handleCardClick = () => {
    isOwnedByUser ? setShowModal(true) : buyItem({
      onError:(error) => {console.log(error);},
      onSuccess: handleBuyItemSuccess
    })
  }

  const handleBuyItemSuccess = async(tx) => {
    await tx.wait(1);
    dispatch({
      type:"success",
      message: "Item Bought",
      title: "Item Bought",
      position: "topR"
    });
  }
  return (
    <div>
      <div>
        {imageURI ? (
          <div>
            <UpdateListingModal
              nftAddress={nftAddress}
              tokenId={tokenId}
              isVisible={showModal}
              marketplaceAddress={marketplaceAddress}
              onClose={hideModal}
            />
            <Card title={tokenName} description={tokenDescription} onClick={handleCardClick}>
              <div className="p-2">
                <div className="flex flex-col items-end gap-2">
                  <div>#{tokenId}</div>
                  <div className="italic text-sm">
                    Owned by {formattedSellerAddress}
                  </div>
                  <img className="object-contain h-48" src={imageURI}/>
                  <div className="font-bold">
                    {ethers.utils.formatUnits(price, "ether")}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
};
