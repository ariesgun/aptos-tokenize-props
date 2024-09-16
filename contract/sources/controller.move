module property_test::controller {

    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::object::{Self, Object, ExtendRef};
    // use aptos_framework::primary_fungible_store;
    // use aptos_framework::dispatchable_fungible_asset;
    // use aptos_framework::function_info;

    // use aptos_token::token::{Self, Token};
    // use aptos_token_objects::token::{Self, Token};
    // use aptos_token_objects::collection::{Self, Collection};

    use property_test::ownership_token;
    use property_test::rewards_pool::{Self, RewardsPool};

    use std::error;
    use std::signer;
    use std::string::{utf8};
    // use std::string_utils::to_string;
    use std::vector::{Self};

    use std::string::String;
    use std::option::{Self, Option};

    use std::debug;

    // Errors list

    /// Caller is not authorized to make this call
    const EUNAUTHORIZED: u64 = 1;

    const ENOT_OWNER: u64 = 2;
    /// No operations are allowed when contract is paused
    const EPAUSED: u64 = 3;

    const ASSET_SYMBOL: vector<u8> = b"oHILTON";
    const APP_OBJECT_SEED: vector<u8> = b"PROP_CONTROLLER";

    // dividends/ yields pool

    // init_module

    // public entry fun deposit
    // public entry fun withdraw

    // create an object to hold the NFT. metadata points to FT?
    // create an object to hold pre-minted tokens.
    // create an object to dividends pool. (users claim or automatic claim upon selling)

    // TODO
    // - OK Store list of listings
    // - OK init_module -> clean up, setup up admins
    // - OK create_listing -> Fill in more information
    // - OK buy_shares -> transfer USDC to listing store.
    // - dividends -> create a FT store, users can claim, map user -> rewards, snapshot?
    // - marketplace to buy/sell tokens (Order book style?)

    // Global per contract
    struct Registry has key {
        listings: vector<Object<ListingInfo>>,
    }

    struct Roles has key {
        creator: address,
        admins: vector<address>,
    }

    struct AppObjectController has key {
        extend_ref: ExtendRef,
    }

    // Unique per Object
    // enum Status has store, drop, copy {
    //     Initial, OnProgress, Paused, Done
    // }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct ListingInfo has key {
        status: u8,
        start_date: u64,
        end_date: u64,
        funding_target: u128,
        token_price: u64,
        ownership_token: Object<Metadata>,
        reward_pool: Object<RewardsPool>,
        minting_fee: u64,
    }

    // Property Name
    // Type : Residential, Office, Apartment, etc
    // Annual rental Yield
    // Token Price
    // Minimum investment
    // Maximum investment
    // Total token supply
    // Property Value
    // NFT URI for documents
    // Location
    // Funding Target

    fun init_module(admin: &signer) {
        let obj_constructor_ref = object::create_named_object(admin, APP_OBJECT_SEED);
        let obj_signer = object::generate_signer(&obj_constructor_ref);
        let obj_extend_ref = object::generate_extend_ref(&obj_constructor_ref);

        move_to(
            &obj_signer,
            AppObjectController {
                extend_ref: obj_extend_ref,
            }
        );

        move_to(
            &obj_signer,
            Roles {
                creator: @admin_addr,
                admins: vector[@admin_addr],
            }
        );

        move_to(
            &obj_signer,
            Registry {
                listings: vector::empty<Object<ListingInfo>>(),
            }
        );
    }

    public entry fun create_entry(
        admin: &signer,
        description: String,
        name: String,
        symbol: String,
        maximum_supply: u128,
        entry_uri: String,
        icon_uri: String,
        _premint_addresses: Option<vector<address>>,
        _premint_amount: Option<vector<u64>>,
        public_mint_start_time: u64,
        public_mint_end_time: u64,
        _public_mint_limit_per_addr: Option<u64>,
        individual_token_price: u64,
        public_mint_fee: u64,
    ) acquires Registry, Roles {
        // Only an admin can issue a new token.
        assert_is_admin(admin);

        let listing_owner_constructor_ref = &object::create_object(@property_test);
        let listing_owner_signer = object::generate_signer(listing_owner_constructor_ref);

        // Create FT
        let ft_constructor_ref = ownership_token::create_ownership_token(
            name,
            symbol,
            0 as u8,
            maximum_supply,
            description,
            entry_uri,
            icon_uri,
        );

        let metadata = object::object_from_constructor_ref<Metadata>(&ft_constructor_ref);

        // Create reward pool
        let apt_fa_metadata = *option::borrow(&coin::paired_metadata<AptosCoin>());
        let reward_pool_obj = rewards_pool::create_entry(apt_fa_metadata);
        // rewards_pool::deposit_reward(admin, reward_pool_obj, apt_fa_metadata, 10);

        // Listing Status
        move_to(
            &listing_owner_signer,
            ListingInfo {
                status: 1,
                start_date: public_mint_start_time,
                end_date: public_mint_end_time,
                funding_target: maximum_supply * (individual_token_price as u128),
                token_price: individual_token_price,
                ownership_token: metadata,
                reward_pool: reward_pool_obj,
                minting_fee: public_mint_fee,
            }
        );

        let listing_obj = object::object_from_constructor_ref(listing_owner_constructor_ref);

        let registry: &mut Registry = borrow_global_mut<Registry>(get_app_signer_addres());
        vector::push_back(&mut registry.listings, listing_obj);

    }

    fun get_app_signer_addres(): address {
        object::create_object_address(&@property_test, APP_OBJECT_SEED)
    }

    fun get_app_signer(signer_address: address): signer acquires AppObjectController {
        let object_controller = borrow_global<AppObjectController>(signer_address);
        object::generate_signer_for_extending(&object_controller.extend_ref)
    }


    // mint/ buy shares
    public entry fun buy_shares(
        account: &signer,
        token_object: Object<ListingInfo>,
        amount: u64
    ) acquires ListingInfo {
        // Check remaining shares > 0
        assert!(remaining_shares(token_object) >= (amount as u128), error::invalid_argument(10));

        // Check if the listing is still active or not.
        let listing_status = borrow_global<ListingInfo>(object::object_address(&token_object));
        assert!(listing_status.status == 1, error::invalid_state(11));

        // Transfer token to this contract? (APT or USDC). amount * UNIT_PRICE
        let usdc_amount = 100;
        // let usdc_metadata = object::address_to_object<Metadata>(listing_status.ownership_token);
        // primary_fungible_store::transfer(account, usdc_metadata, @property_test, usdc_amount);
        aptos_account::transfer(account, @property_test, usdc_amount);

        // Transfer FT to the caller account.
        let metadata: Object<Metadata> = listing_status.ownership_token;
        ownership_token::mint(metadata, signer::address_of(account), amount);
    }

    // close sale
    public entry fun close_sale(
        admin: &signer,
        listing: Object<ListingInfo>,
    ) acquires ListingInfo, Roles {
        assert_is_admin(admin);
        let listing_status: &mut ListingInfo = borrow_global_mut<ListingInfo>(
            object::object_address(&listing)
        );
        listing_status.status = 3;
    }

    // open sale
    public entry fun open_sale(
        admin: &signer,
        listing: Object<ListingInfo>,
    ) acquires ListingInfo, Roles {
        assert_is_admin(admin);
        let listing_status: &mut ListingInfo = borrow_global_mut<ListingInfo>(
            object::object_address(&listing)
        );
        listing_status.status = 1;
    }

    // pause sale
    public entry fun pause_sale(
        admin: &signer,
        listing: Object<ListingInfo>,
    ) acquires ListingInfo, Roles {
        assert_is_admin(admin);
        let listing_status: &mut ListingInfo = borrow_global_mut<ListingInfo>(
            object::object_address(&listing)
        );
        listing_status.status = 2;
    }

    #[view]
    public fun remaining_shares(
        listing: Object<ListingInfo>,
    ) : u128 acquires ListingInfo {
        let listing_info = borrow_global<ListingInfo>(object::object_address(&listing));
        let metadata_obj = listing_info.ownership_token;

        let supply: u128 = option::get_with_default(&fungible_asset::supply(metadata_obj), 0u128);
        let maximum_supply: u128 = option::get_with_default(&fungible_asset::maximum(metadata_obj), supply);

        let result = maximum_supply - supply;
        debug::print(&utf8(b"remaining_shares"));
        debug::print(&result);
        result
    }

    fun assert_is_admin(
        admin: &signer,
    ) acquires Roles {
        let roles = borrow_global<Roles>(get_app_signer_addres());
        assert!(vector::contains(&roles.admins, &signer::address_of(admin)), EUNAUTHORIZED);
    }

    #[view]
    public fun get_all_listings() : vector<Object<ListingInfo>> acquires Registry {
        let registry: &mut Registry = borrow_global_mut<Registry>(get_app_signer_addres());
        registry.listings
    }

    #[view]
    public fun get_listing_info(listing: Object<ListingInfo>): (u8, u64, u64, u128, u64, u64, address, address) acquires ListingInfo {
        let listing_info: &ListingInfo = borrow_global<ListingInfo>(object::object_address(&listing));
        (
            listing_info.status,
            listing_info.start_date,
            listing_info.end_date,
            listing_info.funding_target,
            listing_info.token_price,
            listing_info.minting_fee,
            object::object_address(&listing_info.ownership_token),
            object::object_address(&listing_info.reward_pool)
        )
    }


    #[test(creator = @property_test, receiver = @0x123, core = @0x1)]
    fun test_create_tokenized_property(
        creator: &signer,
        receiver: &signer,
        core: &signer,
    ) acquires ListingInfo, Registry, Roles {

        let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(core);
        aptos_account::create_account(signer::address_of(receiver));
        coin::deposit(signer::address_of(receiver), coin::mint(10000, &mint_cap));

        init_module(creator);

        ownership_token::initialize(creator);

        create_entry(
            creator,
            utf8(b"description"),
            utf8(b"name"),
            utf8(b"symbol"),
            100000000,
            utf8(b"uri"),
        );

        let listings = get_all_listings();
        debug::print(&vector::length(&listings));
        assert!(vector::length(&listings) == 1, 1);

        let listing_info_obj = *vector::borrow(&listings, 0);

        let asset_symbol: vector<u8> = b"PROPERTY_A";
        // let asset_addr = object::create_object_address(&signer::address_of(creator), asset_symbol);
        let asset_addr = object::object_address(&listing_info_obj);
        // let listing_info = object::address_to_object<ListingInfo>(asset_addr);
        let listing_info = borrow_global<ListingInfo>(asset_addr);
        // let metadata: Object<Metadata> = object::address_to_object<Metadata>(listing_info.ownership_token);
        let metadata = listing_info.ownership_token;

        debug::print(&fungible_asset::name(metadata));
        // assert!(primary_fungible_store::balance(object::object_address(&listing_info_obj), metadata) == 100000000, 5);
        open_sale(creator, listing_info_obj);
        buy_shares(receiver, listing_info_obj, 100);

        assert!(coin::balance<AptosCoin>(signer::address_of(receiver)) == 9900, 2);

        let listing_info = borrow_global<ListingInfo>(asset_addr);
        // let store_signer = &object::generate_signer_for_extending(&listing_info.extend_ref);
        // assert!(primary_fungible_store::balance(signer::address_of(store_signer), metadata) == 99999900, 5);
        assert!(primary_fungible_store::balance(signer::address_of(receiver), metadata) == 100, 3);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);

        // assert!(managed_property.object_addr == asset_addr, 1);


        // let collection = string::utf8(b"Tokenized Properties");
        // let name = utf8(b"name");
        // let token_address = token::create_token_address(
        //     &signer::address_of(creator),
        //     &collection,
        //     &name
        // );
        // let token_obj = object::address_to_object<Token>(token_address);
        // debug::print(&token::description<Token>(token_obj));
        // let hey: String = utf8(b"description");
        // debug::print(&hey);
        // assert!(token::description<Token>(token_obj) == hey, 2);

        // list_property(
        //     creator,
        //     utf8(b"description2"),
        //     utf8(b"name2"),
        //     b"B",
        // );

        // let name2 = utf8(b"name2");
        // let token_address = token::create_token_address(
        //     &signer::address_of(creator),
        //     &collection,
        //     &name2
        // );
        // let token_obj = object::address_to_object<Token>(token_address);
        // debug::print(&token::description<Token>(token_obj));
        // let hey: String = utf8(b"description2");
        // debug::print(&hey);
        // assert!(token::description<Token>(token_obj) == hey, 2);

        // let asset_symbol: vector<u8> = b"PROPERTY_B";
        // let asset_addr = object::create_object_address(&signer::address_of(creator), asset_symbol);
        // let obj = object::address_to_object<Metadata>(asset_addr);

        // let managed_property: &ManagedTokenizedProperty = borrow_global<ManagedTokenizedProperty>(asset_addr);

        // assert!(managed_property.object_addr == asset_addr, 1);

    }


}


/*

module marketplace
module tokenized_property
    NFT -> FT
    rewards_pool




*/