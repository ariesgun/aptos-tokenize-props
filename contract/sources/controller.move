module property_test::controller {

    use aptos_framework::aptos_account;
    use aptos_framework::code;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleAsset};
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::object_code_deployment;

    // use aptos_framework::primary_fungible_store;
    // use aptos_framework::dispatchable_fungible_asset;
    // use aptos_framework::function_info;
    use aptos_std::type_info;

    // use aptos_token::token::{Self, Token};
    // use aptos_token_objects::token::{Self, Token};
    // use aptos_token_objects::collection::{Self, Collection};

    use property_test::ownership_token;
    use property_test::rewards_pool::{Self, RewardsPool};
    use property_test::coin_wrapper;

    use econia::market;
    use econia::user;

    use std::error;
    use std::signer;
    use std::string::{utf8};
    // use std::string_utils::to_string;
    use std::vector::{Self};

    use std::string::String;
    use std::option::{Self, Option};

    use std::bcs;
    use std::debug;
    use aptos_framework::util;
    use aptos_framework::account;

    // Errors list

    /// Caller is not authorized to make this call
    const EUNAUTHORIZED: u64 = 1;

    const ENOT_OWNER: u64 = 2;
    /// No operations are allowed when contract is paused
    const EPAUSED: u64 = 3;

    const ASSET_SYMBOL: vector<u8> = b"oHILTON";
    const APP_OBJECT_SEED: vector<u8> = b"PROP_CONTROLLER";

    const METADATA_SERIALIZED: vector<u8> = x"1270726f70732d636f696e2d777261707065720100000000000000004037393546324231413237334343424242334133313731344543303546443933324138453036433746303035354430323138323038324141383333424334344143c6011f8b08000000000002ff4d4e4baec2300cdcfb1428fba6bced93582024aec0a28a909b181a41e3c84ecbf549c447ec3c3fcf0c19fd0dafe420e14c9bddc664e1ac9de798ba8760ce240656128d9c9afc67b7766b009732b16865060730600842aaa40e4eafd0a13ed899b3a962a0b5fb313422530a947c24b5fb5c588f52db1f2c3707d7585acf544ad6ffbeaf705a46eb79eeb139bb3b8efa3e3d0bd96a3020b4b6d08c3125aa5897314469d4cb39f34afde553f28e7ff167e4ef2e074f16762a151b010000011170726f705f777261707065725f636f696eb6021f8b08000000000002ff5d92316bc330108577ff8a2b856243c0fb250d85cea543860ea508c53e07b5b6244ee78610f2df2bcb4aeb468ba4a7d3e9bd0fd535dee17670ce16836bc79ee08db5f7c4cfce5844cfceabe3aca8264a702e0a88a3ae610c04da8b0baa633dd0d1f117a2db7f522388e71df5dd0a5ed3f6b2fe77696a4a2c2725146269e3acb0eb7be275aa9a4a82b48872f2a48ceddc8d1e848d3d20eed29c7b47716c64e91ece7099cfbad182b146d41cb10c645b628487600e96b88aa1208f68b127811843e9b6650a011ee11a2a2b4a9c9aa5f2a9d36a20d1ad165dad975dfe52c5844c5a28f1bbc2dcbc44e493cb6d76b35abe995b65fbf7efdf868e1f69edc77d6f9a94e840a212221be99715c2cc6311e617606639156e1684b66595dfb91475bd893f61fa083f080b57fe1302000000000300000000000000000000000000000000000000000000000000000000000000010e4170746f734672616d65776f726b00000000000000000000000000000000000000000000000000000000000000010b4170746f735374646c696200000000000000000000000000000000000000000000000000000000000000010a4d6f76655374646c696200";
    const CODE: vector<vector<u8>> = vector[
        x"a11ceb0b060000000a010006020608030e10041e0205200a072a660890014010d001280af801050cfd011000000101010200030000010407000005000100000602000002080001010002030001080101060c0108001170726f705f777261707065725f636f696e06737472696e6709747970655f696e666f0b57726170706572436f696e06537472696e670d6765745f747970655f6e616d650b696e69745f6d6f64756c650b64756d6d795f6669656c6409747970655f6e616d65608f7bd51fce6fe06762d738b8b7b19ca9d63720006c9142670f52ea45ff31e60000000000000000000000000000000000000000000000000000000000000001126170746f733a3a6d657461646174615f7631140000010d6765745f747970655f6e616d6501010000020107010001000000023800020100000000010200",
    ];

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
        addr: address,
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
        market_id: u64,
        wrapper_coin: Option<address>,
    }

    struct ExampleUSDCCC {}

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
                addr: signer::address_of(admin),
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

        coin_wrapper::initialize();
    }

    #[view]
    public fun get_extend_address(): address acquires AppObjectController {
        let registry: &AppObjectController = borrow_global<AppObjectController>(get_app_signer_addres());
        registry.addr

    }

    public entry fun mint_fake_coin(
        account: &signer
    ) {
        debug::print(&utf8(b"SSSS"));
        debug::print(&coin::is_coin_initialized<ExampleUSDCCC>());
        coin_wrapper::mint_fake<ExampleUSDCCC>(account);
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
                market_id: 0,
                wrapper_coin: option::none(),
            }
        );

        let listing_obj = object::object_from_constructor_ref(listing_owner_constructor_ref);

        let registry: &mut Registry = borrow_global_mut<Registry>(get_app_signer_addres());
        vector::push_back(&mut registry.listings, listing_obj);

    }

    public entry fun create_example_usdc(account: &signer) acquires AppObjectController {
        let app_signer = get_app_signer(get_app_signer_addres());
        coin_wrapper::create_coin<ExampleUSDCCC>(
            &app_signer,
            utf8(b"ABCD"),
            utf8(b"ABCD"),
            1,
            false
        );
    }

    #[view]
    public fun get_coin_addr(): address {
        // coin::coin_address<ExampleUSDCCC>()
        let type_info = type_info::type_of<ExampleUSDCCC>();
        type_info::account_address(&type_info)
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

    // -------------------------------------
    public entry fun create_coin_wrapper<CoinType>(
        account: &signer,
        // listing: Object<ListingInfo>,
        fa_metadata: Object<Metadata>
    ) {
        // assert_is_admin(account);

        // let listing_info: &mut ListingInfo = borrow_global_mut<ListingInfo>(
        //     object::object_address(&listing)
        // );
        coin_wrapper::create_coin_asset<CoinType>(account, fa_metadata);
        // listing_info.wrapper_coin = option::some(signer::address_of(account));
    }

    // Deposit to Econia
    public entry fun wrap_ownership_token<CoinType>(
        account: &signer,
        metadata: Object<Metadata>,
        amount: u64,
    ) {
        if (!coin::is_account_registered<CoinType>(signer::address_of(account))) {
            // Register one.
          coin::register<CoinType>(account);
        };

        let fa: FungibleAsset = primary_fungible_store::withdraw(account, metadata, amount);
        let coins = coin_wrapper::wrap_fa<CoinType>(fa);
        coin::deposit<CoinType>(signer::address_of(account), coins);
    }

    // Withdraw from Econia
    public entry fun unwrap_ownership_token<CoinType>(
        account: &signer,
        amount: u64,
    ) {
        let coins = coin::withdraw<CoinType>(account, amount);
        let fa = coin_wrapper::unwrap_fa<CoinType>(coins);
        primary_fungible_store::deposit(signer::address_of(account), fa);
    }

    #[view]
    public fun get_coin_type_from_fa(listing_info: Object<ListingInfo>): String acquires ListingInfo {
        let listing_status: &ListingInfo = borrow_global<ListingInfo>(
            object::object_address(&listing_info)
        );
        coin_wrapper::get_coin_type_from_fa(listing_status.ownership_token)
    }

    // Create a marketplace using Econia API
    // Step 1. create_object_and_publish_package
    public entry fun create_secondary_market_step_1(
        admin: &signer,
        listing: Object<ListingInfo>,
        metadata_serialized: vector<u8>,
        code: vector<vector<u8>>,
    ) acquires ListingInfo, Roles {
        assert_is_admin(admin);

        let seeds = vector[];

        let sequence_number = account::get_sequence_number(signer::address_of(admin)) + 1;
        let separator: vector<u8> = b"aptos_framework::object_code_deployment";
        vector::append(&mut seeds, bcs::to_bytes(&separator));
        vector::append(&mut seeds, bcs::to_bytes(&sequence_number));

        let constructor_ref = &object::create_named_object(admin, seeds);
        let code_signer = &object::generate_signer(constructor_ref);
        let code_signer_addr = object::address_from_constructor_ref(constructor_ref);

        code::publish_package_txn(
            code_signer,
            metadata_serialized,
            code
        );

        let listing_status: &mut ListingInfo = borrow_global_mut<ListingInfo>(
            object::object_address(&listing)
        );
        listing_status.wrapper_coin = option::some(code_signer_addr);
    }

    // Step 2. Register the market using the newly created coin type using Econia SDK
    public entry fun create_secondary_market<QuoteAssetType>(
        admin: &signer,
        listing: Object<ListingInfo>,
    ) acquires ListingInfo, Roles {
        assert_is_admin(admin);
        let listing_status: &mut ListingInfo = borrow_global_mut<ListingInfo>(
            object::object_address(&listing)
        );

        let type_info = &type_info::type_of<QuoteAssetType>();
        // assert!(type_info::account_address(type_info) == option::get_with_default(&listing_status.wrapper_coin, @0), 13);

        // Step 2: get the type and the front-end should call `create_secondary_market_step_2<>`
        let lot_size = 1; // 1 Wrapper Coin
        let tick_size = 1000000; // 0.01 WrapperCoin
        let min_size = 1; // 1 APT
        market::register_market_base_coin_from_coinstore<
            QuoteAssetType,
            aptos_framework::aptos_coin::AptosCoin,
            aptos_framework::aptos_coin::AptosCoin,
        >(
            admin,
            lot_size,
            tick_size,
            min_size
        );
    }

    public entry fun set_market_id(
        admin: &signer,
        listing: Object<ListingInfo>,
        market_id: u64,
     ) acquires ListingInfo, Roles {
        assert_is_admin(admin);
        let listing_status: &mut ListingInfo = borrow_global_mut<ListingInfo>(
            object::object_address(&listing)
        );

        listing_status.market_id = market_id;
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
    public fun get_listing_info(listing: Object<ListingInfo>): (u8, u64, u64, u128, u64, u64, address, address, u64) acquires ListingInfo {
        let listing_info: &ListingInfo = borrow_global<ListingInfo>(object::object_address(&listing));
        (
            listing_info.status,
            listing_info.start_date,
            listing_info.end_date,
            listing_info.funding_target,
            listing_info.token_price,
            listing_info.minting_fee,
            object::object_address(&listing_info.ownership_token),
            object::object_address(&listing_info.reward_pool),
            listing_info.market_id,
        )
    }

    #[test(admin = @property_test, account = @0x123, core = @0x01)]
    fun test_basic(
        admin: &signer,
        core: &signer,
        account: &signer,
    ) {
        let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(core);
        aptos_account::create_account(signer::address_of(admin));
        package_manager::init_module_internal(admin);
        coin_wrapper::initialize_mo(admin);
        coin_wrapper::initialize();

        coin_wrapper::create_coin<ExampleUSDCCC>(
            admin,
            utf8(b"ABCD"),
            utf8(b"wABCD"),
            1,
            false,
        );
        init_module(admin);
        debug::print(&coin::name<ExampleUSDCCC>());

        debug::print(&type_info::type_name<ExampleUSDCCC>());

        mint_fake_coin(admin);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test_only]
    struct FakeMoney {}

    #[test_only]
    use property_test::package_manager;

     #[test(admin = @property_test, receiver = @0x123, core = @0x01)]
    fun test_create_coin_wrapper(
        admin: &signer,
        core: &signer,
        receiver: &signer,
    ) acquires Registry, ListingInfo, Roles {
        let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(core);
        aptos_account::create_account(signer::address_of(admin));
        coin::deposit(signer::address_of(admin), coin::mint(10000, &mint_cap));
        aptos_account::create_account(signer::address_of(receiver));
        coin::deposit(signer::address_of(receiver), coin::mint(10000, &mint_cap));

        ownership_token::initialize(admin);
        package_manager::init_module_internal(admin);
        coin_wrapper::initialize_mo(admin);
        coin_wrapper::initialize();

        init_module(admin);

        create_entry(
            admin,
            utf8(b"description"),
            utf8(b"name"),
            utf8(b"symbol"),
            100000000,
            utf8(b"uri"),
            utf8(b"icon"),
            option::none(),
            option::none(),
            0,
            100,
            option::none(),
            10,
            0,
        );

        let publisher_address = signer::address_of(admin);
        let sequence_number = account::get_sequence_number(signer::address_of(admin)) + 1;

        debug::print(&utf8(b"sss"));
        debug::print(&signer::address_of(admin));
        debug::print(&sequence_number);

        let seeds = vector[];
        let separator: vector<u8> = b"aptos_framework::object_code_deployment";
        vector::append(&mut seeds, bcs::to_bytes(&separator));
        vector::append(&mut seeds, bcs::to_bytes(&sequence_number));
        debug::print(&seeds);

        let listings = get_all_listings();
        debug::print(&vector::length(&listings));
        assert!(vector::length(&listings) == 1, 1);

        let listing_info_obj = *vector::borrow(&listings, 0);
        let asset_addr = object::object_address(&listing_info_obj);
        let listing_info = borrow_global<ListingInfo>(asset_addr);
        let metadata = listing_info.ownership_token;

        // create_coin_wrapper<FakeMoney>(admin, listing_info_obj);

        // create_secondary_market_step_1(admin, listing_info_obj, METADATA_SERIALIZED, CODE);

        create_coin_wrapper<FakeMoney>(admin, metadata);

        buy_shares(receiver, listing_info_obj, 100);
        assert!(coin::balance<AptosCoin>(signer::address_of(receiver)) == 9900, 2);
        assert!(primary_fungible_store::balance(signer::address_of(receiver), metadata) == 100, 3);

        wrap_ownership_token<FakeMoney>(receiver, metadata, 5);
        assert!(coin::balance<FakeMoney>(signer::address_of(receiver)) == 5, 4);
        assert!(primary_fungible_store::balance(signer::address_of(receiver), metadata) == 95, 5);

        unwrap_ownership_token<FakeMoney>(receiver, 5);
        assert!(coin::balance<FakeMoney>(signer::address_of(receiver)) == 0, 6);
        assert!(primary_fungible_store::balance(signer::address_of(receiver), metadata) == 100, 7);

        let type_name = get_coin_type_from_fa(listing_info_obj);
        debug::print(&type_name);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // #[test(creator = @property_test, receiver = @0x123, core = @0x1)]
    // fun test_create_tokenized_property(
    //     creator: &signer,
    //     receiver: &signer,
    //     core: &signer,
    // ) acquires ListingInfo, Registry, Roles {

    //     let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(core);
    //     aptos_account::create_account(signer::address_of(receiver));
    //     coin::deposit(signer::address_of(receiver), coin::mint(10000, &mint_cap));

    //     init_module(creator);

    //     ownership_token::initialize(creator);

    //     create_entry(
    //         creator,
    //         utf8(b"description"),
    //         utf8(b"name"),
    //         utf8(b"symbol"),
    //         100000000,
    //         utf8(b"uri"),
    //     );

    //     let listings = get_all_listings();
    //     debug::print(&vector::length(&listings));
    //     assert!(vector::length(&listings) == 1, 1);

    //     let listing_info_obj = *vector::borrow(&listings, 0);

    //     let asset_symbol: vector<u8> = b"PROPERTY_A";
    //     // let asset_addr = object::create_object_address(&signer::address_of(creator), asset_symbol);
    //     let asset_addr = object::object_address(&listing_info_obj);
    //     // let listing_info = object::address_to_object<ListingInfo>(asset_addr);
    //     let listing_info = borrow_global<ListingInfo>(asset_addr);
    //     // let metadata: Object<Metadata> = object::address_to_object<Metadata>(listing_info.ownership_token);
    //     let metadata = listing_info.ownership_token;

    //     debug::print(&fungible_asset::name(metadata));
    //     // assert!(primary_fungible_store::balance(object::object_address(&listing_info_obj), metadata) == 100000000, 5);
    //     open_sale(creator, listing_info_obj);
    //     buy_shares(receiver, listing_info_obj, 100);

    //     assert!(coin::balance<AptosCoin>(signer::address_of(receiver)) == 9900, 2);

    //     let listing_info = borrow_global<ListingInfo>(asset_addr);
    //     // let store_signer = &object::generate_signer_for_extending(&listing_info.extend_ref);
    //     // assert!(primary_fungible_store::balance(signer::address_of(store_signer), metadata) == 99999900, 5);
    //     assert!(primary_fungible_store::balance(signer::address_of(receiver), metadata) == 100, 3);

    //     coin::destroy_burn_cap(burn_cap);
    //     coin::destroy_mint_cap(mint_cap);

    //     // assert!(managed_property.object_addr == asset_addr, 1);


    //     // let collection = string::utf8(b"Tokenized Properties");
    //     // let name = utf8(b"name");
    //     // let token_address = token::create_token_address(
    //     //     &signer::address_of(creator),
    //     //     &collection,
    //     //     &name
    //     // );
    //     // let token_obj = object::address_to_object<Token>(token_address);
    //     // debug::print(&token::description<Token>(token_obj));
    //     // let hey: String = utf8(b"description");
    //     // debug::print(&hey);
    //     // assert!(token::description<Token>(token_obj) == hey, 2);

    //     // list_property(
    //     //     creator,
    //     //     utf8(b"description2"),
    //     //     utf8(b"name2"),
    //     //     b"B",
    //     // );

    //     // let name2 = utf8(b"name2");
    //     // let token_address = token::create_token_address(
    //     //     &signer::address_of(creator),
    //     //     &collection,
    //     //     &name2
    //     // );
    //     // let token_obj = object::address_to_object<Token>(token_address);
    //     // debug::print(&token::description<Token>(token_obj));
    //     // let hey: String = utf8(b"description2");
    //     // debug::print(&hey);
    //     // assert!(token::description<Token>(token_obj) == hey, 2);

    //     // let asset_symbol: vector<u8> = b"PROPERTY_B";
    //     // let asset_addr = object::create_object_address(&signer::address_of(creator), asset_symbol);
    //     // let obj = object::address_to_object<Metadata>(asset_addr);

    //     // let managed_property: &ManagedTokenizedProperty = borrow_global<ManagedTokenizedProperty>(asset_addr);

    //     // assert!(managed_property.object_addr == asset_addr, 1);

    // }


}


/*

module marketplace
module tokenized_property
    NFT -> FT
    rewards_pool




*/