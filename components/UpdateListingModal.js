import React, { useState } from 'react'
import { useWeb3Contract } from 'react-moralis';
import { Modal, Input, useNotification } from 'web3uikit'
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import {ethers} from "ethers"

export default function UpdateListingModal ({nftAddress, tokenId, isVisible, marketplaceAddress, onClose}) {
  const [ priceUpdateListingWith, setPriceUpdateListingWith] = useState(0);
  const dispatch = useNotification()
  const {runContractFunction: updateListing} = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName:"updateListing",
    params:{
        nftAddress, tokenId, 
        newPrice: ethers.utils.parseEther(priceUpdateListingWith || "0")
    }
  });

  const handleUpdateListingSuccess = async (tx) => {
    await tx.wait(1);
    dispatch({
        type:"success",
        message: "Listing updated",
        title: "Listing updated please referesh and move blocks",
        position: "topR"
    })
    onClose && onClose();
    setPriceUpdateListingWith("0");
  }

  return (
    <Modal
        isVisible={isVisible}
        onCancel={onClose}
        onCloseButtonPressed={onClose}
        onOk={() => {
            updateListing({
                onError:(error)=>{console.log(error)},
                onSuccess: handleUpdateListingSuccess
            })
        }}
    >
        <Input
            label='Update listing  L1 Currency (ETH)'
            name="New Listing price"
            type="number"
            onChange={(event) => {
                setPriceUpdateListingWith(event.target.value)
            }}
        />

    </Modal>
  )
}
