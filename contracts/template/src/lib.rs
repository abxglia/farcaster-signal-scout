// Stylus smart contract for the Top Signals Browser (SocialFi/Analytics) Mini-App.
// Minimal version optimized for deployment size.

#![cfg_attr(not(any(feature = "export-abi", test)), no_std, no_main)]
extern crate alloc;

use stylus_sdk::{alloy_primitives::U256, prelude::*, storage::StorageU256};
use alloc::{string::String, vec::Vec};
use alloc::vec;
use alloc::format;

use openzeppelin_stylus::token::erc721::Erc721;
use openzeppelin_stylus::token::erc721::IErc721;

/// Main contract struct for the Top Signals Browser
#[entrypoint]
#[storage]
pub struct TopSignalsBrowserContract {
    /// ERC721 implementation for Researcher NFTs
    #[borrow]
    pub erc721: Erc721,
    /// Counter for minted NFTs
    pub researcher_supply: StorageU256,
    /// Global counter for tracking interactions
    pub global_counter: StorageU256,
    /// Counter for token subscriptions
    pub subscription_counter: StorageU256,
}

/// Public interface for the contract
#[public]
#[inherit(Erc721)]
impl TopSignalsBrowserContract {
    /// Initialize contract
    pub fn initialize(&mut self) -> Result<(), Vec<u8>> {
        Ok(())
    }

    /// Increments the global counter by 1
    pub fn increment_counter(&mut self) -> Result<(), Vec<u8>> {
        let current = self.global_counter.get();
        self.global_counter.set(current + U256::from(1));
        Ok(())
    }

    /// Gets the current counter value
    pub fn get_counter(&self) -> Result<U256, Vec<u8>> {
        Ok(self.global_counter.get())
    }

    /// Checks if the counter is a multiple of 10
    pub fn is_counter_multiple_of_ten(&self) -> Result<bool, Vec<u8>> {
        let counter = self.global_counter.get();
        Ok(counter % U256::from(10) == U256::from(0) && counter > U256::from(0))
    }

    /// Gets the next milestone (multiple of 10)
    pub fn get_next_counter_milestone(&self) -> Result<U256, Vec<u8>> {
        let counter = self.global_counter.get();
        let remainder = counter % U256::from(10);
        if remainder == U256::from(0) {
            Ok(counter)
        } else {
            Ok(counter + U256::from(10) - remainder)
        }
    }

    /// Mint NFT when counter reaches multiple of 10
    pub fn mint_nft_at_milestone(&mut self) -> Result<(), Vec<u8>> {
        let user = self.vm().msg_sender();
        let is_milestone = self.is_counter_multiple_of_ten()?;
        if !is_milestone {
            return Err(b"Counter not at milestone".to_vec());
        }
        let user_balance = self.erc721.balance_of(user)?;
        if user_balance > U256::from(0) {
            return Err(b"User already has an NFT".to_vec());
        }
        let token_id = self.researcher_supply.get() + U256::from(1);
        self.researcher_supply.set(token_id);
        self.erc721._mint(user, token_id)?;
        Ok(())
    }

    /// Subscribe to token threshold alerts
    pub fn subscribe_to_token(&mut self, _fid: U256, _token: String, _threshold: U256) -> Result<U256, Vec<u8>> {
        let subscription_id = self.subscription_counter.get() + U256::from(1);
        self.subscription_counter.set(subscription_id);
        let current_counter = self.global_counter.get();
        self.global_counter.set(current_counter + U256::from(1));
        Ok(subscription_id)
    }

    /// Get subscription counter
    pub fn get_subscription_counter(&self) -> Result<U256, Vec<u8>> {
        Ok(self.subscription_counter.get())
    }

    /// Mint Signal Scout NFT
    pub fn mint_signal_scout_nft(&mut self) -> Result<(), Vec<u8>> {
        let user = self.vm().msg_sender();
        let user_balance = self.erc721.balance_of(user)?;
        if user_balance > U256::from(0) {
            return Err(b"User already has an NFT".to_vec());
        }
        let token_id = self.researcher_supply.get() + U256::from(1);
        self.researcher_supply.set(token_id);
        self.erc721._mint(user, token_id)?;
        Ok(())
    }

    pub fn name(&self) -> Result<String, Vec<u8>> {
        Ok(String::from("Top Signals Browser Researcher"))
    }

    pub fn symbol(&self) -> Result<String, Vec<u8>> {
        Ok(String::from("TSBR"))
    }

    #[selector(name = "tokenURI")]
    pub fn token_uri(&self, token_id: U256) -> Result<String, Vec<u8>> {
        let image = "/researcher-nft.svg";
        let metadata = format!(
            r#"{{"name":"Top Signals Researcher #{}","description":"NFT awarded to users who have analyzed tokens in the Top Signals Browser.","image":"{}","attributes":[{{"trait_type":"Role","value":"Researcher"}},{{"trait_type":"Analytics Level","value":"Expert"}}]}}"#,
            token_id,
            image
        );
        Ok(metadata)
    }
}

#[cfg(test)]
mod tests {
    use crate::TopSignalsBrowserContract;
    use openzeppelin_stylus::token::erc721::IErc721;
    use stylus_sdk::alloy_primitives::{address, uint};

    #[motsu::test]
    fn test_researcher_nft_minting(contract: TopSignalsBrowserContract) {
        let test_address = address!("1234567891234567891234567891234567891234");
        let token_id = uint!(1_U256);
        let _ = contract.erc721._mint(test_address, token_id);
        let owner = contract.erc721.owner_of(token_id).unwrap();
        assert_eq!(owner, test_address);
    }
}